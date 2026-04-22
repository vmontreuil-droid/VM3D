#!/data/data/com.termux/files/usr/bin/bash
# Tablet remote-view setup voor MV3D Cloud
# ---------------------------------------------------------------
# Wat dit script doet:
#   1. Installeert benodigde packages in Termux (cloudflared, websockify, jq, curl)
#   2. Start een Cloudflare quick-tunnel naar localhost:6080 (websockify)
#   3. Start websockify die droidVNC-NG (poort 5900) wrapt + serveert noVNC HTML
#   4. POST de publieke tunnel-URL naar /api/machines/tunnel
#   5. Bij Ctrl+C of crash: meldt de URL als 'null' zodat de admin-pagina hem niet meer toont
#
# Vooraf nodig op de tablet:
#   - Termux geïnstalleerd (F-Droid versie aanbevolen — Play Store versie is verouderd)
#   - droidVNC-NG geïnstalleerd uit F-Droid of Play Store
#   - droidVNC-NG geopend, "Start" gedrukt, screen-capture en (optioneel)
#     Accessibility-toestemming gegeven voor input-injectie
#   - droidVNC-NG instellingen: poort 5900, geen wachtwoord (tunnel zelf is geheim)
#
# Gebruik:
#   curl -fsSL https://mv3d.be/tablet-remote-setup.sh -o setup.sh && bash setup.sh
#
# ---------------------------------------------------------------

set -euo pipefail

API_BASE="${API_BASE:-https://mv3d.be}"
VNC_PORT="${VNC_PORT:-5900}"
WS_PORT="${WS_PORT:-6080}"
NOVNC_VERSION="${NOVNC_VERSION:-v1.5.0}"
NOVNC_DIR="$HOME/.mv3d/noVNC"
TUNNEL_LOG="$HOME/.mv3d/cloudflared.log"

mkdir -p "$HOME/.mv3d"

echo
echo "===================================================="
echo "  MV3D Cloud — Tablet remote-view setup"
echo "===================================================="
echo

# ---- 1. Vraag connection_code ----
if [[ -z "${CONNECTION_CODE:-}" ]]; then
  read -rp "Connection code van deze machine (uit /admin/machines): " CONNECTION_CODE
fi
CONNECTION_CODE="$(echo "$CONNECTION_CODE" | tr -d '[:space:]')"
if [[ -z "$CONNECTION_CODE" ]]; then
  echo "Geen connection code opgegeven. Stop."
  exit 1
fi

# ---- 2. Installeer dependencies ----
echo
echo "[1/4] Packages installeren (Termux)..."
pkg update -y >/dev/null 2>&1 || true
pkg install -y cloudflared python jq curl unzip >/dev/null
pip install --quiet websockify || true

# ---- 3. Download noVNC client ----
if [[ ! -f "$NOVNC_DIR/vnc.html" ]]; then
  echo "[2/4] noVNC ${NOVNC_VERSION} downloaden..."
  TMP_ZIP="$(mktemp).zip"
  curl -fsSL "https://github.com/novnc/noVNC/archive/refs/tags/${NOVNC_VERSION}.zip" -o "$TMP_ZIP"
  unzip -q "$TMP_ZIP" -d "$HOME/.mv3d"
  rm -f "$TMP_ZIP"
  rm -rf "$NOVNC_DIR"
  mv "$HOME/.mv3d/noVNC-${NOVNC_VERSION#v}" "$NOVNC_DIR"
else
  echo "[2/4] noVNC al aanwezig in $NOVNC_DIR — sla over."
fi

# ---- 4. Start websockify (achtergrond) ----
echo "[3/4] websockify starten (poort ${WS_PORT} → localhost:${VNC_PORT})..."
pkill -f "websockify.*${WS_PORT}" 2>/dev/null || true
sleep 1
nohup websockify --web "$NOVNC_DIR" "${WS_PORT}" "localhost:${VNC_PORT}" \
  > "$HOME/.mv3d/websockify.log" 2>&1 &
WS_PID=$!
sleep 2
if ! kill -0 "$WS_PID" 2>/dev/null; then
  echo "websockify kon niet starten. Check $HOME/.mv3d/websockify.log"
  exit 1
fi

# ---- 5. Start cloudflared quick tunnel ----
echo "[4/4] Cloudflare-tunnel starten..."
pkill -f "cloudflared.*tunnel" 2>/dev/null || true
sleep 1
> "$TUNNEL_LOG"
nohup cloudflared tunnel --url "http://localhost:${WS_PORT}" --no-autoupdate \
  > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

# Wacht max 30s op een trycloudflare URL in de log
TUNNEL_URL=""
for _ in $(seq 1 30); do
  TUNNEL_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -n1 || true)
  [[ -n "$TUNNEL_URL" ]] && break
  sleep 1
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "Geen tunnel-URL gevonden in $TUNNEL_LOG. Stop."
  kill "$TUNNEL_PID" 2>/dev/null || true
  kill "$WS_PID" 2>/dev/null || true
  exit 1
fi

echo
echo "Tunnel actief: $TUNNEL_URL"
echo

# ---- 6. URL melden bij MV3D ----
echo "URL doorsturen naar $API_BASE ..."
RESPONSE=$(curl -fsS -X POST "$API_BASE/api/machines/tunnel" \
  -H "Content-Type: application/json" \
  -d "{\"connection_code\":\"${CONNECTION_CODE}\",\"tunnel_url\":\"${TUNNEL_URL}\"}" \
  || echo '{"error":"network"}')

if echo "$RESPONSE" | jq -e '.ok == true' >/dev/null 2>&1; then
  MACHINE=$(echo "$RESPONSE" | jq -r '.machine')
  echo "OK — gekoppeld aan machine: $MACHINE"
else
  echo "Fout bij melden: $RESPONSE"
fi

# ---- 7. Cleanup hook: meldt URL = null bij Ctrl+C of exit ----
cleanup() {
  echo
  echo "Tunnel sluiten en URL ongedaan maken..."
  curl -fsS -X POST "$API_BASE/api/machines/tunnel" \
    -H "Content-Type: application/json" \
    -d "{\"connection_code\":\"${CONNECTION_CODE}\",\"tunnel_url\":null}" \
    >/dev/null 2>&1 || true
  kill "$TUNNEL_PID" 2>/dev/null || true
  kill "$WS_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo
echo "===================================================="
echo "  Tunnel actief — sluit dit venster NIET."
echo "  Admin kan nu de tablet bekijken via /admin/machines/<id>"
echo "  Druk Ctrl+C om te stoppen."
echo "===================================================="

# Wacht op de tunnel-process; herstart bij crash
while true; do
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "cloudflared gecrasht — herstarten..."
    nohup cloudflared tunnel --url "http://localhost:${WS_PORT}" --no-autoupdate \
      > "$TUNNEL_LOG" 2>&1 &
    TUNNEL_PID=$!
    sleep 5
    NEW_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -n1 || true)
    if [[ -n "$NEW_URL" && "$NEW_URL" != "$TUNNEL_URL" ]]; then
      TUNNEL_URL="$NEW_URL"
      echo "Nieuwe URL: $TUNNEL_URL"
      curl -fsS -X POST "$API_BASE/api/machines/tunnel" \
        -H "Content-Type: application/json" \
        -d "{\"connection_code\":\"${CONNECTION_CODE}\",\"tunnel_url\":\"${TUNNEL_URL}\"}" \
        >/dev/null 2>&1 || true
    fi
  fi
  sleep 30
done
