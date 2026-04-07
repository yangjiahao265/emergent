"""
Backend tests for HTTP Transparent Proxy Service
Tests: health, auth (401/403/200), proxy forwarding, methods, headers, query params, CORS, invalid URL
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
TOKEN = "sk-emergent-proxy-8d4f9a2c1e7b5f3a"
WRONG_TOKEN = "wrong-token-123"
AUTH_HEADER = {"Authorization": f"Bearer {TOKEN}"}


class TestHealth:
    def test_health_returns_ok(self):
        r = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"


class TestAuth:
    """Authentication checks: 401 no header, 403 wrong token, 200 correct token"""

    def test_no_auth_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/https://httpbin.org/get", timeout=15)
        assert r.status_code == 401

    def test_wrong_token_returns_403(self):
        r = requests.get(
            f"{BASE_URL}/api/https://httpbin.org/get",
            headers={"Authorization": f"Bearer {WRONG_TOKEN}"},
            timeout=15,
        )
        assert r.status_code == 403

    def test_correct_token_returns_200(self):
        r = requests.get(
            f"{BASE_URL}/api/https://httpbin.org/get",
            headers=AUTH_HEADER,
            timeout=15,
        )
        assert r.status_code == 200


class TestProxyForwarding:
    """Proxy transparently forwards requests"""

    def test_get_proxy(self):
        r = requests.get(f"{BASE_URL}/api/https://httpbin.org/get", headers=AUTH_HEADER, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "url" in data

    def test_post_with_json_body(self):
        payload = {"hello": "world"}
        r = requests.post(
            f"{BASE_URL}/api/https://httpbin.org/post",
            headers={**AUTH_HEADER, "Content-Type": "application/json"},
            json=payload,
            timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        assert data.get("json") == payload

    def test_authorization_header_forwarded_to_target(self):
        """Auth header should be visible in httpbin response (it echoes headers)"""
        r = requests.get(f"{BASE_URL}/api/https://httpbin.org/get", headers=AUTH_HEADER, timeout=15)
        assert r.status_code == 200
        data = r.json()
        forwarded_auth = data.get("headers", {}).get("Authorization", "")
        assert f"Bearer {TOKEN}" in forwarded_auth

    def test_custom_header_forwarded(self):
        headers = {**AUTH_HEADER, "X-Custom-Header": "test-value-123"}
        r = requests.get(f"{BASE_URL}/api/https://httpbin.org/get", headers=headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("headers", {}).get("X-Custom-Header") == "test-value-123"

    def test_query_params_forwarded(self):
        r = requests.get(
            f"{BASE_URL}/api/https://httpbin.org/get",
            headers=AUTH_HEADER,
            params={"foo": "bar"},
            timeout=15,
        )
        assert r.status_code == 200
        data = r.json()
        assert data.get("args", {}).get("foo") == "bar"

    def test_put_method(self):
        r = requests.put(
            f"{BASE_URL}/api/https://httpbin.org/put",
            headers=AUTH_HEADER,
            json={"key": "val"},
            timeout=15,
        )
        assert r.status_code == 200

    def test_delete_method(self):
        r = requests.delete(
            f"{BASE_URL}/api/https://httpbin.org/delete",
            headers=AUTH_HEADER,
            timeout=15,
        )
        assert r.status_code == 200


class TestEdgeCases:
    def test_invalid_url_returns_400(self):
        r = requests.get(
            f"{BASE_URL}/api/not-a-url",
            headers=AUTH_HEADER,
            timeout=15,
        )
        assert r.status_code == 400

    def test_cors_headers_present(self):
        """OPTIONS preflight should return CORS headers"""
        r = requests.options(
            f"{BASE_URL}/api/https://httpbin.org/get",
            headers={
                "Origin": "https://example.com",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization",
            },
            timeout=15,
        )
        assert r.status_code in [200, 204]
        assert "access-control-allow-origin" in r.headers or "Access-Control-Allow-Origin" in r.headers
