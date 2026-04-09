package proxy

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

// ─── Tunable limits ──────────────────────────────────────────────────────────

const (
	MaxRequestBody = 50 * 1024 * 1024 // 50 MB
	StreamChunkSize = 64 * 1024        // 64 KB per chunk
)

// hopByHop headers that must not be forwarded.
var hopByHop = map[string]bool{
	"connection":          true,
	"keep-alive":          true,
	"proxy-authenticate":  true,
	"proxy-authorization": true,
	"te":                  true,
	"trailers":            true,
	"transfer-encoding":   true,
	"upgrade":             true,
	"proxy-connection":    true,
}

// corsHeaders managed by our middleware; skip from upstream response.
var corsHeaders = map[string]bool{
	"access-control-allow-origin":      true,
	"access-control-allow-methods":     true,
	"access-control-allow-headers":     true,
	"access-control-allow-credentials": true,
	"access-control-expose-headers":    true,
	"access-control-max-age":           true,
}

// skipResponse combines hop-by-hop, CORS, and encoding headers.
func skipResponse(key string) bool {
	k := strings.ToLower(key)
	return hopByHop[k] || corsHeaders[k] || k == "content-encoding" || k == "content-length"
}

// Handler holds the shared HTTP client and serves proxy requests.
type Handler struct {
	client *http.Client
	logger *slog.Logger
}

// NewHandler creates a proxy handler with a tuned HTTP transport.
func NewHandler(logger *slog.Logger) *Handler {
	transport := &http.Transport{
		MaxIdleConns:        200,
		MaxIdleConnsPerHost: 60,
		IdleConnTimeout:     120 * time.Second,
		// Go's default transport supports HTTP/2 automatically via TLS
		ForceAttemptHTTP2: true,
	}
	client := &http.Client{
		Transport: transport,
		Timeout:   30 * time.Second,
		// Follow redirects (default behavior)
	}
	return &Handler{client: client, logger: logger}
}

// checkAuth validates the Authorization header.
// Returns nil on success, or writes an error response and returns an error.
func checkAuth(w http.ResponseWriter, r *http.Request) error {
	auth := r.Header.Get("Authorization")
	if !strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		http.Error(w, `{"detail":"Unauthorized"}`, http.StatusUnauthorized)
		return fmt.Errorf("missing bearer token")
	}
	token := strings.TrimSpace(auth[7:])
	if !strings.HasPrefix(token, "sk-emergent-") {
		http.Error(w, `{"detail":"Forbidden"}`, http.StatusForbidden)
		return fmt.Errorf("invalid token prefix")
	}
	return nil
}

// normalizeURL fixes collapsed double-slash: https:/example.com -> https://example.com
func normalizeURL(path string) string {
	if strings.HasPrefix(path, "https:/") && !strings.HasPrefix(path, "https://") {
		return "https://" + path[7:]
	}
	if strings.HasPrefix(path, "http:/") && !strings.HasPrefix(path, "http://") {
		return "http://" + path[6:]
	}
	return path
}

// ServeHTTP handles proxy requests at /api/{target_url}.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Extract the target path after /api/
	fullPath := strings.TrimPrefix(r.URL.Path, "/api/")

	// Health check endpoint
	if fullPath == "health" && r.Method == http.MethodGet {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","service":"HTTP Transparent Proxy","pool":"ready"}`))
		return
	}

	// Auth check
	if err := checkAuth(w, r); err != nil {
		return
	}

	targetURL := normalizeURL(fullPath)

	if !strings.HasPrefix(targetURL, "http://") && !strings.HasPrefix(targetURL, "https://") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprintf(w, `{"detail":"Invalid target URL '%s'. Path after /api/ must be a full http(s):// URL."}`, targetURL)
		return
	}

	// Append original query string
	if r.URL.RawQuery != "" {
		targetURL = targetURL + "?" + r.URL.RawQuery
	}

	// Read body with size limit
	body := http.MaxBytesReader(w, r.Body, MaxRequestBody)
	defer body.Close()

	h.logger.Info("Proxying", "method", r.Method, "target", targetURL)

	// Build upstream request
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	upstreamReq, err := http.NewRequestWithContext(ctx, r.Method, targetURL, body)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		fmt.Fprintf(w, `{"detail":"Failed to build upstream request: %s"}`, err.Error())
		return
	}

	// Forward headers, skip hop-by-hop and host
	for key, values := range r.Header {
		if hopByHop[strings.ToLower(key)] || strings.EqualFold(key, "host") {
			continue
		}
		for _, v := range values {
			upstreamReq.Header.Add(key, v)
		}
	}

	// Send request
	resp, err := h.client.Do(upstreamReq)
	if err != nil {
		h.logger.Error("Upstream error", "method", r.Method, "target", targetURL, "error", err)
		w.Header().Set("Content-Type", "application/json")
		if ctx.Err() == context.DeadlineExceeded {
			w.WriteHeader(http.StatusGatewayTimeout)
			_, _ = w.Write([]byte(`{"detail":"Upstream request timed out"}`))
		} else {
			w.WriteHeader(http.StatusBadGateway)
			_, _ = w.Write([]byte(`{"detail":"Upstream request failed"}`))
		}
		return
	}
	defer resp.Body.Close()

	// Copy response headers, skip filtered set
	for key, values := range resp.Header {
		if skipResponse(key) {
			continue
		}
		for _, v := range values {
			w.Header().Add(key, v)
		}
	}

	// Write status code
	w.WriteHeader(resp.StatusCode)

	// Stream response body
	buf := make([]byte, StreamChunkSize)
	if flusher, ok := w.(http.Flusher); ok {
		for {
			n, readErr := resp.Body.Read(buf)
			if n > 0 {
				if _, writeErr := w.Write(buf[:n]); writeErr != nil {
					return
				}
				flusher.Flush()
			}
			if readErr != nil {
				break
			}
		}
	} else {
		_, _ = io.CopyBuffer(w, resp.Body, buf)
	}
}
