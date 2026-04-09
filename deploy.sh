#!/usr/bin/env bash
#
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  Emergent — One-Click Install & Deploy Script                              ║
# ║                                                                            ║
# ║  This script downloads the latest (or specified) release binary from       ║
# ║  GitHub, installs it to /usr/local/bin, and optionally creates a           ║
# ║  systemd service for auto-start on boot.                                   ║
# ║                                                                            ║
# ║  Usage:                                                                    ║
# ║    curl -fsSL https://raw.githubusercontent.com/yangjiahao265/emergent/\   ║
# ║      main/deploy.sh | bash                                                 ║
# ║                                                                            ║
# ║  Or download and run manually:                                             ║
# ║    chmod +x deploy.sh                                                      ║
# ║    ./deploy.sh                                                             ║
# ║    ./deploy.sh --version v1.2.0                                            ║
# ║    ./deploy.sh --port 9090                                                 ║
# ║    ./deploy.sh --no-service        # skip systemd setup                    ║
# ║    ./deploy.sh --uninstall         # remove binary + service               ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
set -euo pipefail

# ─── Configurable Defaults ────────────────────────────────────────────────────
REPO="yangjiahao265/emergent"
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="emergent"
SERVICE_NAME="emergent"
DEFAULT_PORT=8080

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()  { echo -e "${CYAN}[INFO]${RESET}  $*"; }
ok()    { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
err()   { echo -e "${RED}[ERR]${RESET}   $*" >&2; }
die()   { err "$@"; exit 1; }

# ─── Parse Arguments ─────────────────────────────────────────────────────────
VERSION=""
PORT="${DEFAULT_PORT}"
SETUP_SERVICE=true
UNINSTALL=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version|-v)    VERSION="$2"; shift 2 ;;
        --port|-p)       PORT="$2"; shift 2 ;;
        --no-service)    SETUP_SERVICE=false; shift ;;
        --uninstall)     UNINSTALL=true; shift ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --version, -v VERSION   Install a specific version (e.g. v1.0.0)"
            echo "  --port, -p PORT         Set listening port (default: 8080)"
            echo "  --no-service            Skip systemd service creation"
            echo "  --uninstall             Remove binary and systemd service"
            echo "  --help, -h              Show this help message"
            exit 0
            ;;
        *) die "Unknown option: $1. Use --help for usage." ;;
    esac
done

# ─── Detect Platform ─────────────────────────────────────────────────────────
detect_platform() {
    local os arch

    case "$(uname -s)" in
        Linux*)   os="linux" ;;
        Darwin*)  os="darwin" ;;
        MINGW*|MSYS*|CYGWIN*) os="windows" ;;
        *) die "Unsupported OS: $(uname -s)" ;;
    esac

    case "$(uname -m)" in
        x86_64|amd64)   arch="amd64" ;;
        aarch64|arm64)  arch="arm64" ;;
        *) die "Unsupported architecture: $(uname -m)" ;;
    esac

    echo "${os}-${arch}"
}

# ─── Resolve Latest Version ──────────────────────────────────────────────────
resolve_version() {
    if [[ -n "${VERSION}" ]]; then
        echo "${VERSION}"
        return
    fi

    info "Fetching latest release tag..."
    local tag
    tag=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
        | grep '"tag_name"' \
        | head -1 \
        | sed -E 's/.*"tag_name":\s*"([^"]+)".*/\1/')

    if [[ -z "${tag}" ]]; then
        die "Failed to determine latest version. Specify one with --version."
    fi
    echo "${tag}"
}

# ─── Uninstall ────────────────────────────────────────────────────────────────
do_uninstall() {
    info "Uninstalling ${BINARY_NAME}..."

    # Stop and disable systemd service if it exists
    if command -v systemctl &>/dev/null && systemctl list-unit-files "${SERVICE_NAME}.service" &>/dev/null; then
        info "Stopping systemd service..."
        sudo systemctl stop "${SERVICE_NAME}" 2>/dev/null || true
        sudo systemctl disable "${SERVICE_NAME}" 2>/dev/null || true
        sudo rm -f "/etc/systemd/system/${SERVICE_NAME}.service"
        sudo systemctl daemon-reload
        ok "Systemd service removed."
    fi

    # Remove binary
    if [[ -f "${INSTALL_DIR}/${BINARY_NAME}" ]]; then
        sudo rm -f "${INSTALL_DIR}/${BINARY_NAME}"
        ok "Binary removed from ${INSTALL_DIR}/${BINARY_NAME}"
    else
        warn "Binary not found at ${INSTALL_DIR}/${BINARY_NAME}"
    fi

    ok "Uninstall complete."
    exit 0
}

# ═══════════════════════════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║     Emergent — Deploy Script             ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${RESET}"
echo ""

# Handle uninstall early
if [[ "${UNINSTALL}" == true ]]; then
    do_uninstall
fi

# ── Step 1: Detect platform ──────────────────────────────────────────────────
PLATFORM=$(detect_platform)
info "Detected platform: ${BOLD}${PLATFORM}${RESET}"

# ── Step 2: Resolve version ──────────────────────────────────────────────────
VERSION=$(resolve_version)
info "Target version:    ${BOLD}${VERSION}${RESET}"

# ── Step 3: Build download URL ───────────────────────────────────────────────
EXT=""
if [[ "${PLATFORM}" == windows-* ]]; then
    EXT=".exe"
fi

ARTIFACT="emergent-${PLATFORM}${EXT}"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/${ARTIFACT}"

info "Download URL:      ${DOWNLOAD_URL}"
echo ""

# ── Step 4: Download binary ──────────────────────────────────────────────────
TMPDIR=$(mktemp -d)
trap 'rm -rf "${TMPDIR}"' EXIT

info "Downloading ${ARTIFACT}..."
if ! curl -fSL --progress-bar -o "${TMPDIR}/${BINARY_NAME}" "${DOWNLOAD_URL}"; then
    die "Download failed. Check if version '${VERSION}' exists at:"
    die "  https://github.com/${REPO}/releases"
fi
ok "Download complete."

# ── Step 5: Install binary ───────────────────────────────────────────────────
info "Installing to ${INSTALL_DIR}/${BINARY_NAME}..."
chmod +x "${TMPDIR}/${BINARY_NAME}"
sudo mv "${TMPDIR}/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
ok "Installed: $(${INSTALL_DIR}/${BINARY_NAME} --version 2>/dev/null || echo "${VERSION}")"

# ── Step 6: Verify ───────────────────────────────────────────────────────────
if command -v "${BINARY_NAME}" &>/dev/null; then
    ok "${BINARY_NAME} is now available in PATH."
else
    warn "${INSTALL_DIR} may not be in your PATH. Run with full path:"
    warn "  ${INSTALL_DIR}/${BINARY_NAME} --port ${PORT}"
fi

# ── Step 7: Systemd service (optional, Linux only) ───────────────────────────
if [[ "${SETUP_SERVICE}" == true ]] && [[ "$(uname -s)" == "Linux" ]] && command -v systemctl &>/dev/null; then
    echo ""
    info "Setting up systemd service..."

    sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" > /dev/null <<UNIT
[Unit]
Description=Emergent Data Portal
Documentation=https://github.com/${REPO}
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${INSTALL_DIR}/${BINARY_NAME} --port ${PORT}
Restart=on-failure
RestartSec=5
LimitNOFILE=65536

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=true

# Environment file (optional, create to set vars)
EnvironmentFile=-/etc/emergent/env

[Install]
WantedBy=multi-user.target
UNIT

    sudo systemctl daemon-reload
    sudo systemctl enable "${SERVICE_NAME}"
    sudo systemctl restart "${SERVICE_NAME}"

    # Wait briefly, then check status
    sleep 1
    if systemctl is-active --quiet "${SERVICE_NAME}"; then
        ok "Service '${SERVICE_NAME}' is running on port ${PORT}."
    else
        warn "Service started but may not be healthy. Check:"
        warn "  sudo journalctl -u ${SERVICE_NAME} -f"
    fi
else
    if [[ "${SETUP_SERVICE}" == false ]]; then
        info "Skipping systemd service (--no-service)."
    elif [[ "$(uname -s)" != "Linux" ]]; then
        info "Systemd not available on $(uname -s). Start manually:"
        info "  ${BINARY_NAME} --port ${PORT}"
    fi
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════${RESET}"
echo -e "${GREEN}${BOLD}  Deployment complete!${RESET}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════${RESET}"
echo ""
echo -e "  ${CYAN}Binary:${RESET}   ${INSTALL_DIR}/${BINARY_NAME}"
echo -e "  ${CYAN}Version:${RESET}  ${VERSION}"
echo -e "  ${CYAN}Port:${RESET}     ${PORT}"
echo ""
echo -e "  ${BOLD}Quick commands:${RESET}"
echo -e "    ${CYAN}Start manually:${RESET}   ${BINARY_NAME} --port ${PORT}"
if [[ "$(uname -s)" == "Linux" ]] && command -v systemctl &>/dev/null; then
echo -e "    ${CYAN}Service status:${RESET}   sudo systemctl status ${SERVICE_NAME}"
echo -e "    ${CYAN}View logs:${RESET}        sudo journalctl -u ${SERVICE_NAME} -f"
echo -e "    ${CYAN}Restart:${RESET}          sudo systemctl restart ${SERVICE_NAME}"
echo -e "    ${CYAN}Stop:${RESET}             sudo systemctl stop ${SERVICE_NAME}"
fi
echo -e "    ${CYAN}Uninstall:${RESET}        $0 --uninstall"
echo ""
