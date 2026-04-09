package main

import (
	"embed"
	"flag"
	"fmt"
	"io/fs"
	"log/slog"
	"net/http"
	"os"

	"github.com/yangjiahao265/emergent/internal/proxy"
)

// version is set via -ldflags at build time.
var version = "dev"

//go:embed all:frontend
var frontendFS embed.FS

func main() {
	port := flag.Int("port", 8080, "listen port")
	showVersion := flag.Bool("version", false, "print version and exit")
	flag.Parse()

	if *showVersion {
		fmt.Println("emergent", version)
		return
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	mux := http.NewServeMux()

	// ─── API proxy ────────────────────────────────────────────────────────────
	proxyHandler := proxy.NewHandler(logger)
	mux.Handle("/api/", proxyHandler)

	// ─── Frontend static files ────────────────────────────────────────────────
	frontendSub, err := fs.Sub(frontendFS, "frontend")
	if err != nil {
		logger.Error("Failed to open embedded frontend", "error", err)
		os.Exit(1)
	}
	fileServer := http.FileServer(http.FS(frontendSub))
	// SPA fallback: serve index.html for non-file routes
	mux.Handle("/", spaHandler(fileServer, frontendSub))

	// ─── CORS wrapper ─────────────────────────────────────────────────────────
	handler := proxy.CORS(mux)

	addr := fmt.Sprintf(":%d", *port)
	logger.Info("Starting server", "addr", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		logger.Error("Server failed", "error", err)
		os.Exit(1)
	}
}

// spaHandler returns a handler that tries to serve a static file,
// falling back to index.html for SPA routing.
func spaHandler(fileServer http.Handler, fsys fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Try the requested path first
		path := r.URL.Path
		if path == "/" {
			fileServer.ServeHTTP(w, r)
			return
		}

		// Check if the file exists in the embedded FS
		cleanPath := path[1:] // strip leading /
		if _, err := fs.Stat(fsys, cleanPath); err == nil {
			fileServer.ServeHTTP(w, r)
			return
		}

		// SPA fallback: serve index.html
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	})
}
