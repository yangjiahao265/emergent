#!/usr/bin/env bash
# Startup script for the emergent Go binary backend.
# Included in the repo so the production image has it.
# On first run it downloads the right architecture binary,
# then exec's it so supervisor tracks the process correctly.

set -euo pipefail

BINARY="/usr/local/bin/emergent"
REPO="yangjiahao265/emergent"
VERSION="v1.0.0"
PORT="${EMERGENT_PORT:-8001}"

# ── Detect architecture ────────────────────────────────────────────────────
detect_platform() {
    local arch
    case "$(uname -m)" in
        x86_64|amd64)   arch="amd64" ;;
        aarch64|arm64)  arch="arm64" ;;
        *)               arch="amd64" ;;  # safe default for Kubernetes
    esac
    echo "linux-${arch}"
}

# ── Download if binary is missing ─────────────────────────────────────────
if [ ! -x "$BINARY" ]; then
    PLATFORM=$(detect_platform)
    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/emergent-${PLATFORM}"

    echo "[INFO] emergent binary not found. Downloading ${VERSION} for ${PLATFORM}..."
    echo "[INFO] URL: ${DOWNLOAD_URL}"

    TMP=$(mktemp)

    # Try wget → curl → Python urllib (in order of preference)
    download_ok=false

    if command -v wget &>/dev/null; then
        echo "[INFO] Using wget to download..."
        wget -q --tries=3 -O "$TMP" "$DOWNLOAD_URL" && download_ok=true
    fi

    if [ "$download_ok" = false ] && command -v curl &>/dev/null; then
        echo "[INFO] Using curl to download..."
        curl -fsSL --retry 3 --retry-delay 2 -o "$TMP" "$DOWNLOAD_URL" && download_ok=true
    fi

    if [ "$download_ok" = false ] && command -v python3 &>/dev/null; then
        echo "[INFO] Using python3 urllib to download..."
        python3 - "$DOWNLOAD_URL" "$TMP" <<'PYEOF'
import sys, urllib.request
url, dest = sys.argv[1], sys.argv[2]
urllib.request.urlretrieve(url, dest)
print("[OK]   python3 download complete")
PYEOF
        download_ok=true
    fi

    if [ "$download_ok" = false ] && command -v python &>/dev/null; then
        echo "[INFO] Using python urllib to download..."
        python - "$DOWNLOAD_URL" "$TMP" <<'PYEOF'
import sys, urllib.request
url, dest = sys.argv[1], sys.argv[2]
urllib.request.urlretrieve(url, dest)
PYEOF
        download_ok=true
    fi

    if [ "$download_ok" = true ]; then
        chmod +x "$TMP"
        mv "$TMP" "$BINARY"
        echo "[OK]   Installed emergent at ${BINARY}"
    else
        echo "[ERR]  No download tool available (wget/curl/python3/python). Aborting."
        rm -f "$TMP"
        exit 1
    fi
else
    echo "[INFO] emergent binary already installed at ${BINARY} ($(${BINARY} --version 2>/dev/null || echo 'unknown version'))"
fi

# ── Run ───────────────────────────────────────────────────────────────────
echo "[INFO] Starting emergent -port ${PORT}"
exec "$BINARY" -port "$PORT"