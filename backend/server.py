import os

import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from pathlib import Path
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ─── Tunable limits ──────────────────────────────────────────────────────────
MAX_REQUEST_BODY = 50 * 1024 * 1024          # 50 MB
POOL_LIMITS = httpx.Limits(
    max_connections=200,                       # total connections in pool
    max_keepalive_connections=60,              # idle keep-alive connections
    keepalive_expiry=120,                      # seconds before idle conn is closed
)
TIMEOUT = httpx.Timeout(
    connect=5.0,
    read=30.0,
    write=10.0,
    pool=5.0,
)
STREAM_CHUNK_SIZE = 64 * 1024                 # 64 KB per chunk

# ─── Shared async client (connection-pooled, created once) ───────────────────
_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _client
    _client = httpx.AsyncClient(
        limits=POOL_LIMITS,
        timeout=TIMEOUT,
        follow_redirects=True,
        http2=True,
    )
    logger.info("Proxy client started  pool=%s  timeout=%s", POOL_LIMITS, TIMEOUT)
    yield
    await _client.aclose()
    _client = None
    logger.info("Proxy client closed")


app = FastAPI(title="HTTP Transparent Proxy Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hop-by-hop headers that must not be forwarded
HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "proxy-connection",
}

# CORS headers managed by our middleware; skip from upstream response
CORS_HEADERS = {
    "access-control-allow-origin", "access-control-allow-methods",
    "access-control-allow-headers", "access-control-allow-credentials",
    "access-control-expose-headers", "access-control-max-age",
}

# content-encoding/length may be invalid after httpx decompression
SKIP_RESPONSE = HOP_BY_HOP | CORS_HEADERS | {"content-encoding", "content-length"}


def check_auth(request: Request):
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    token = auth[7:].strip()
    if not token.startswith("sk-emergent-"):
        raise HTTPException(status_code=403, detail="Forbidden")


def normalize_url(path: str) -> str:
    """Fix collapsed double-slash: https:/example.com -> https://example.com"""
    if path.startswith("https:/") and not path.startswith("https://"):
        return "https://" + path[7:]
    if path.startswith("http:/") and not path.startswith("http://"):
        return "http://" + path[6:]
    return path


@app.get("/api/health")
async def health():
    client_ready = _client is not None
    return {
        "status": "ok",
        "service": "HTTP Transparent Proxy",
        "pool": "ready" if client_ready else "not ready",
    }


@app.api_route(
    "/api/{full_path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
)
async def proxy(request: Request, full_path: str):
    check_auth(request)

    target_url = normalize_url(full_path)

    if not target_url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid target URL '{target_url}'. Path after /api/ must be a full http(s):// URL."
        )

    # Append original query string
    qs = request.url.query
    if qs:
        target_url = f"{target_url}?{qs}"

    # Forward headers, skip hop-by-hop and replace host
    fwd_headers = {
        k: v for k, v in request.headers.items()
        if k.lower() not in HOP_BY_HOP and k.lower() != "host"
    }

    # Read body with size limit
    body = await request.body()
    if len(body) > MAX_REQUEST_BODY:
        raise HTTPException(status_code=413, detail=f"Request body exceeds {MAX_REQUEST_BODY} bytes limit")

    logger.info("Proxying %s %s", request.method, target_url)

    try:
        upstream_req = _client.build_request(
            method=request.method,
            url=target_url,
            headers=fwd_headers,
            content=body or None,
        )
        resp = await _client.send(upstream_req, stream=True)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream request timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Failed to connect to upstream")
    except httpx.TooManyRedirects:
        raise HTTPException(status_code=502, detail="Too many redirects from upstream")
    except httpx.HTTPError as exc:
        logger.error("Upstream error: %s %s -> %s", request.method, target_url, exc)
        raise HTTPException(status_code=502, detail="Upstream request failed")

    resp_headers = {
        k: v for k, v in resp.headers.items()
        if k.lower() not in SKIP_RESPONSE
    }

    # True streaming: pipe upstream bytes to client as they arrive
    async def stream_body():
        try:
            async for chunk in resp.aiter_bytes(chunk_size=STREAM_CHUNK_SIZE):
                yield chunk
        finally:
            await resp.aclose()

    return StreamingResponse(
        content=stream_body(),
        status_code=resp.status_code,
        headers=resp_headers,
    )
