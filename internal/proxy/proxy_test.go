package proxy

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCheckAuth_NoHeader(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/https://example.com", nil)
	rec := httptest.NewRecorder()
	err := checkAuth(rec, req)
	if err == nil {
		t.Fatal("expected error for missing auth header")
	}
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestCheckAuth_WrongToken(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/https://example.com", nil)
	req.Header.Set("Authorization", "Bearer wrong-token-123")
	rec := httptest.NewRecorder()
	err := checkAuth(rec, req)
	if err == nil {
		t.Fatal("expected error for wrong token")
	}
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rec.Code)
	}
}

func TestCheckAuth_CorrectToken(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/https://example.com", nil)
	req.Header.Set("Authorization", "Bearer sk-emergent-test-token")
	rec := httptest.NewRecorder()
	err := checkAuth(rec, req)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestNormalizeURL(t *testing.T) {
	tests := []struct {
		input string
		want  string
	}{
		{"https:/example.com", "https://example.com"},
		{"http:/example.com", "http://example.com"},
		{"https://example.com", "https://example.com"},
		{"http://example.com", "http://example.com"},
		{"not-a-url", "not-a-url"},
	}
	for _, tt := range tests {
		got := normalizeURL(tt.input)
		if got != tt.want {
			t.Errorf("normalizeURL(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestHealth(t *testing.T) {
	handler := NewHandler(nil)
	mux := http.NewServeMux()
	mux.Handle("/api/", handler)

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	body := rec.Body.String()
	if !strings.Contains(body, `"status":"ok"`) {
		t.Fatalf("unexpected health response: %s", body)
	}
}

func TestProxy_InvalidURL(t *testing.T) {
	handler := NewHandler(nil)
	mux := http.NewServeMux()
	mux.Handle("/api/", handler)

	req := httptest.NewRequest(http.MethodGet, "/api/not-a-url", nil)
	req.Header.Set("Authorization", "Bearer sk-emergent-test")
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestCORS_Preflight(t *testing.T) {
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	handler := CORS(inner)

	req := httptest.NewRequest(http.MethodOptions, "/api/health", nil)
	req.Header.Set("Origin", "https://example.com")
	req.Header.Set("Access-Control-Request-Method", "GET")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatal("missing CORS allow-origin header")
	}
}
