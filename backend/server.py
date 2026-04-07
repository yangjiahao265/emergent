import os
import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from dotenv import load_dotenv
from pathlib import Path
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

PROXY_TOKEN = os.environ.get("PROXY_AUTH_TOKEN", "")

app = FastAPI(title="HTTP Transparent Proxy Service")

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
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header. Required: Authorization: Bearer <token>"
        )
    token = auth[7:].strip()
    if not PROXY_TOKEN:
        raise HTTPException(status_code=500, detail="Proxy token not configured on server")
    if token != PROXY_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid token")


def normalize_url(path: str) -> str:
    """Fix collapsed double-slash: https:/example.com -> https://example.com"""
    if path.startswith("https:/") and not path.startswith("https://"):
        return "https://" + path[7:]
    if path.startswith("http:/") and not path.startswith("http://"):
        return "http://" + path[6:]
    return path


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "HTTP Transparent Proxy"}


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

    body = await request.body()

    logger.info("Proxying %s %s", request.method, target_url)

    async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
        resp = await client.request(
            method=request.method,
            url=target_url,
            headers=fwd_headers,
            content=body or None,
        )

    resp_headers = {
        k: v for k, v in resp.headers.items()
        if k.lower() not in SKIP_RESPONSE
    }

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=resp_headers,
    )
