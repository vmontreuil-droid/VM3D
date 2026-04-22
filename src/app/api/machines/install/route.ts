import { NextRequest, NextResponse } from 'next/server'

// Tablet installer — one command does everything.
// Usage on the tablet (inside Termux):
//   wget -qO- "http://SERVER/api/machines/install?code=XXXX" | bash
export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get('code') || '').trim().toUpperCase()
  if (!code || code.length < 4) {
    return new NextResponse(
      'echo "FOUT: geen connection code"\necho "Gebruik: wget -qO- URL?code=JOUWCODE | bash"\nexit 1\n',
      { headers: { 'Content-Type': 'text/plain' } },
    )
  }

  const host = req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const serverUrl = `${proto}://${host}`

  const script = buildInstallerScript(code, serverUrl)

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}

function buildInstallerScript(code: string, server: string): string {
  // The installer is written in 3 distinct pieces:
  //   1. the installer itself (this function returns bash that runs on the tablet)
  //   2. a sync.sh payload (below, inside a heredoc with NO expansion)
  //   3. a boot script to auto-start sync.sh
  //
  // Only ${CODE} / ${SERVER} are substituted into sync.sh at install time
  // via plain `sed`. All other shell expansion inside sync.sh is literal.
  const SYNC_SH = buildSyncScript()

  return `#!/data/data/com.termux/files/usr/bin/env bash
# VM Plan & Consult — Tablet Sync Installer
set -u

CODE="${code}"
SERVER="${server}"

banner() {
  echo ""
  echo "======================================"
  echo "  VM Machine Sync — Installatie"
  echo "======================================"
  echo "  Code:   $CODE"
  echo "  Server: $SERVER"
  echo ""
}
banner

# ---------- 1. Storage -----------------------------------------------------
echo "[1/5] Storage toegang..."
termux-setup-storage 2>/dev/null || true
sleep 1

# ---------- 2. Mirror forceren ---------------------------------------------
echo "[2/5] Termux-mirror forceren op Cloudflare..."
mkdir -p "$PREFIX/etc/apt" "$PREFIX/etc/termux"
rm -rf "$PREFIX/etc/termux/chosen_mirrors" 2>/dev/null
rm -f  "$PREFIX/etc/apt/sources.list.d/"*.list 2>/dev/null

MIRRORS=(
  "https://packages-cf.termux.dev/apt/termux-main"
  "https://packages.termux.dev/apt/termux-main"
  "https://grimler.se/termux/termux-main"
)
WORKING_MIRROR=""
for M in "\${MIRRORS[@]}"; do
  echo "  -> $M"
  printf 'deb %s stable main\\n' "$M" > "$PREFIX/etc/apt/sources.list"
  printf 'deb %s stable main\\n' "$M" > "$PREFIX/etc/termux/chosen_mirrors"
  rm -rf "$PREFIX/var/lib/apt/lists/"* 2>/dev/null
  if apt update -o Acquire::Retries=2 -o Acquire::ForceIPv4=true >/dev/null 2>&1; then
    if apt-cache show curl >/dev/null 2>&1; then
      WORKING_MIRROR="$M"
      echo "  OK"
      break
    fi
  fi
done
if [ -z "$WORKING_MIRROR" ]; then
  echo "  WAARSCHUWING: geen werkende Termux-mirror — bestaande tools worden gebruikt"
fi
dpkg --configure -a >/dev/null 2>&1 || true

# ---------- 3. Dependencies ------------------------------------------------
echo "[3/5] curl + jq + termux-api installeren..."
if [ -n "$WORKING_MIRROR" ]; then
  apt install -y --no-install-recommends curl jq termux-api >/dev/null 2>&1 || true
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "FOUT: curl is niet beschikbaar en kan niet geïnstalleerd worden."
  echo "Probeer handmatig: pkg i curl"
  exit 1
fi

# jq via apt faalt vaak — gebruik static binary als fallback
if ! command -v jq >/dev/null 2>&1; then
  echo "  jq ontbreekt — static binary downloaden..."
  ARCH=$(uname -m 2>/dev/null || echo unknown)
  case "$ARCH" in
    aarch64|arm64) JQ_URL="https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-linux-arm64" ;;
    armv7l|armv8l) JQ_URL="https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-linux-armhf" ;;
    x86_64)        JQ_URL="https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-linux-amd64" ;;
    *)             JQ_URL="" ;;
  esac
  if [ -n "$JQ_URL" ]; then
    if curl -fsSL --connect-timeout 15 -o "$PREFIX/bin/jq" "$JQ_URL"; then
      chmod +x "$PREFIX/bin/jq"
    fi
  fi
fi
if command -v jq >/dev/null 2>&1; then
  echo "  OK: curl + jq beschikbaar"
else
  echo "  WAARSCHUWING: jq ontbreekt — server-response kan niet geparseerd worden."
  echo "  Sync probeert verder, maar downloads werken niet zonder jq."
fi

# ---------- 4. Verbinding testen ------------------------------------------
echo "[4/5] Verbinding testen..."
HB=$(curl -fsS --connect-timeout 6 "$SERVER/api/machines/heartbeat" 2>/dev/null || true)
if [ -z "$HB" ]; then
  echo "FOUT: kan $SERVER niet bereiken"
  echo "Check of de tablet in hetzelfde netwerk zit als de server."
  exit 1
fi
echo "  OK"

# ---------- 4b. GPS-setup (termux-location) --------------------------------
echo "[4b/5] GPS-setup..."
if ! command -v termux-location >/dev/null 2>&1; then
  echo "  WAARSCHUWING: termux-location ontbreekt (pkg termux-api niet geïnstalleerd)"
  echo "  -> GPS zal NIET werken tot dit opgelost is:"
  echo "     pkg install termux-api"
else
  # Test of Termux:API APK (de companion Android-app) aanwezig is.
  # Zonder APK print termux-location een foutmelding en exit niet-nul.
  GPS_TEST=$(timeout 10 termux-location -p network -r last 2>&1 || true)
  if printf '%s' "$GPS_TEST" | grep -qiE 'not installed|not found|No such file'; then
    echo "  LET OP: Termux:API APK ontbreekt op dit toestel."
    echo "  De Termux:API Android-app moet geïnstalleerd zijn naast Termux."
    echo "  Installeer via F-Droid: https://f-droid.org/packages/com.termux.api/"
    echo "  (de gewone Termux-app alleen is niet genoeg voor GPS)"
  elif printf '%s' "$GPS_TEST" | grep -qiE 'permission|denied'; then
    echo "  Android vraagt nu locatie-permissie voor Termux:API..."
    echo "  -> Tik in het Android-popup op 'Toestaan' (bij voorkeur 'Altijd')"
    # Forceer de prompt door een live-fix op te vragen (triggert Android dialog)
    timeout 15 termux-location -p network >/dev/null 2>&1 || true
    sleep 2
    GPS_RETRY=$(timeout 8 termux-location -p network -r last 2>&1 || true)
    if printf '%s' "$GPS_RETRY" | grep -qE '"latitude"'; then
      echo "  OK: locatie-permissie verleend — GPS werkt"
    else
      echo "  Nog geen permissie — open later handmatig Android-instellingen:"
      echo "    Apps > Termux:API > Permissies > Locatie = Toestaan"
    fi
  elif printf '%s' "$GPS_TEST" | grep -qE '"latitude"'; then
    echo "  OK: GPS werkt — coordinaten worden elke ~5 min doorgestuurd"
  else
    # Geen laatste-bekende positie maar geen harde fout: probeer verse fix kort
    echo "  Geen bekende positie — vraag verse GPS-fix (max 15s, op dak of bij raam best)"
    timeout 15 termux-location -p network >/dev/null 2>&1 || true
    echo "  OK: termux-location is bereikbaar — GPS volgt zodra fix beschikbaar is"
  fi
fi

# ---------- 5. sync.sh schrijven + boot-hook -------------------------------
echo "[5/5] sync.sh installeren..."
pkill -f "$HOME/sync.sh" 2>/dev/null || true
pkill -f "sync.sh" 2>/dev/null || true

# Schrijf sync.sh letterlijk weg (geen variabele-expansie in dit heredoc)
cat > "$HOME/sync.sh" <<'__SYNC_EOF__'
${SYNC_SH}
__SYNC_EOF__

# Substitueer alleen CODE + SERVER via sed
sed -i "s|__CODE__|$CODE|g" "$HOME/sync.sh"
sed -i "s|__SERVER__|$SERVER|g" "$HOME/sync.sh"
chmod +x "$HOME/sync.sh"

# Auto-start bij boot (vereist Termux:Boot app)
mkdir -p "$HOME/.termux/boot"
cat > "$HOME/.termux/boot/start-vm-sync.sh" <<'__BOOT_EOF__'
#!/data/data/com.termux/files/usr/bin/env bash
termux-wake-lock
exec bash "$HOME/sync.sh" >> "$HOME/sync.log" 2>&1
__BOOT_EOF__
chmod +x "$HOME/.termux/boot/start-vm-sync.sh"

# Preload guidance-mappen zodat ze direct scanbaar zijn
for F in \\
  "/sdcard/Unicontrol/Projects" \\
  "/sdcard/Trimble Data/Projects" \\
  "/sdcard/TopconData/Projects" \\
  "/sdcard/Leica iCON/Projects" \\
  "/sdcard/CHCData/Projects"
do
  mkdir -p "$F" 2>/dev/null || true
done

# ---------- 6. Remote-view (cloudflared + websockify + noVNC) -------------
echo "[6/6] Remote-view setup (cloudflared + websockify + noVNC)..."

# 6a. cloudflared + python(+pip) + unzip via apt
if [ -n "$WORKING_MIRROR" ]; then
  apt install -y --no-install-recommends cloudflared python python-pip unzip >/dev/null 2>&1 || true
fi
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "  WAARSCHUWING: cloudflared kon niet geinstalleerd worden. Remote-view wordt overgeslagen."
  HAS_REMOTE=0
else
  HAS_REMOTE=1
fi

# 6b. websockify — pip met --no-deps (numpy compilatie vermijden) of source-download
if [ "\${HAS_REMOTE:-0}" = "1" ]; then
  # Probeer pip met --no-deps (websockify werkt prima zonder numpy)
  if ! command -v websockify >/dev/null 2>&1; then
    if command -v pip >/dev/null 2>&1; then
      pip install --quiet --break-system-packages --no-deps websockify >/dev/null 2>&1 \\
        || pip install --quiet --no-deps websockify >/dev/null 2>&1 \\
        || true
    elif command -v pip3 >/dev/null 2>&1; then
      pip3 install --quiet --break-system-packages --no-deps websockify >/dev/null 2>&1 \\
        || pip3 install --quiet --no-deps websockify >/dev/null 2>&1 \\
        || true
    fi
  fi

  # Fallback: download websockify-source van GitHub (pure Python, geen compilatie nodig)
  if ! command -v websockify >/dev/null 2>&1; then
    if command -v python >/dev/null 2>&1; then
      WS_DIR="\$HOME/.mv3d/websockify"
      if [ ! -d "\$WS_DIR" ]; then
        mkdir -p "\$HOME/.mv3d"
        TMP_WS="\$(mktemp).tar.gz"
        if curl -fsSL --connect-timeout 30 -o "\$TMP_WS" \\
           "https://github.com/novnc/websockify/archive/refs/tags/v0.12.0.tar.gz"; then
          tar xzf "\$TMP_WS" -C "\$HOME/.mv3d" 2>/dev/null && \\
            rm -rf "\$WS_DIR" 2>/dev/null && \\
            mv "\$HOME/.mv3d/websockify-0.12.0" "\$WS_DIR"
          rm -f "\$TMP_WS"
        fi
      fi
      if [ -f "\$WS_DIR/run" ]; then
        cat > "\$PREFIX/bin/websockify" <<EOF_WS
#!/data/data/com.termux/files/usr/bin/env bash
exec python "\$WS_DIR/run" "\\\$@"
EOF_WS
        chmod +x "\$PREFIX/bin/websockify"
      fi
    fi
  fi

  if ! command -v websockify >/dev/null 2>&1; then
    echo "  WAARSCHUWING: websockify kon niet geinstalleerd worden. Remote-view wordt overgeslagen."
    echo "  Handmatig herstellen op tablet:"
    echo "    curl -fsSL https://github.com/novnc/websockify/archive/refs/tags/v0.12.0.tar.gz | tar xz -C \\\$HOME/.mv3d/"
    echo "    mv \\\$HOME/.mv3d/websockify-0.12.0 \\\$HOME/.mv3d/websockify"
    echo "    echo '#!/bin/sh' > \\\$PREFIX/bin/websockify"
    echo "    echo 'exec python \\\$HOME/.mv3d/websockify/run \\\\\\\"\\\\\\\$@\\\\\\\"' >> \\\$PREFIX/bin/websockify"
    echo "    chmod +x \\\$PREFIX/bin/websockify"
    echo "    bash \\\$HOME/remote.sh &"
    HAS_REMOTE=0
  else
    echo "  OK: websockify beschikbaar"
  fi
fi

# 6c. noVNC client downloaden
NOVNC_DIR="$HOME/.mv3d/noVNC"
if [ "\${HAS_REMOTE:-0}" = "1" ] && [ ! -f "$NOVNC_DIR/vnc.html" ]; then
  mkdir -p "$HOME/.mv3d"
  TMP="$(mktemp).zip"
  if curl -fsSL --connect-timeout 30 -o "$TMP" "https://github.com/novnc/noVNC/archive/refs/tags/v1.5.0.zip" \\
     && unzip -q "$TMP" -d "$HOME/.mv3d" 2>/dev/null; then
    rm -rf "$NOVNC_DIR" 2>/dev/null
    mv "$HOME/.mv3d/noVNC-1.5.0" "$NOVNC_DIR"
    rm -f "$TMP"
  else
    echo "  WAARSCHUWING: noVNC download mislukt — remote-view skip"
    HAS_REMOTE=0
  fi
fi

# 6d. remote.sh schrijven (tunnel + websockify + URL melden)
if [ "\${HAS_REMOTE:-0}" = "1" ]; then
  pkill -f "$HOME/remote.sh" 2>/dev/null || true
  cat > "$HOME/remote.sh" <<'__REMOTE_EOF__'
#!/data/data/com.termux/files/usr/bin/env bash
CODE="__CODE__"
SERVER="__SERVER__"
NOVNC_DIR="$HOME/.mv3d/noVNC"
TUNNEL_LOG="$HOME/.mv3d/cloudflared.log"
mkdir -p "$HOME/.mv3d"

LOG() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [remote] $*"; }

cleanup() {
  curl -fsS -X POST "$SERVER/api/machines/tunnel" \
    -H "Content-Type: application/json" \
    -d "{\"connection_code\":\"$CODE\",\"tunnel_url\":null}" >/dev/null 2>&1 || true
  pkill -f "websockify.*6080" 2>/dev/null || true
  pkill -f "cloudflared.*tunnel" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

LOG "websockify starten op poort 6080 -> localhost:5900"
pkill -f "websockify.*6080" 2>/dev/null || true
sleep 1
nohup websockify --web "$NOVNC_DIR" 6080 localhost:5900 > "$HOME/.mv3d/websockify.log" 2>&1 &

LOG "cloudflared quick-tunnel starten"
pkill -f "cloudflared.*tunnel" 2>/dev/null || true
sleep 1
> "$TUNNEL_LOG"
nohup cloudflared tunnel --url "http://localhost:6080" --no-autoupdate > "$TUNNEL_LOG" 2>&1 &

TUNNEL_URL=""
for _ in $(seq 1 30); do
  TUNNEL_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -n1 || true)
  [ -n "$TUNNEL_URL" ] && break
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  LOG "Geen tunnel-URL gevonden; remote-view niet beschikbaar"
  exit 1
fi
LOG "Tunnel actief: $TUNNEL_URL"

curl -fsS -X POST "$SERVER/api/machines/tunnel" \
  -H "Content-Type: application/json" \
  -d "{\"connection_code\":\"$CODE\",\"tunnel_url\":\"$TUNNEL_URL\"}" >/dev/null 2>&1 || true

# Watchdog: herstart cloudflared bij crash en meld nieuwe URL
LAST_URL="$TUNNEL_URL"
while true; do
  sleep 30
  if ! pgrep -f "cloudflared.*tunnel" >/dev/null; then
    LOG "cloudflared gecrasht — herstarten"
    > "$TUNNEL_LOG"
    nohup cloudflared tunnel --url "http://localhost:6080" --no-autoupdate > "$TUNNEL_LOG" 2>&1 &
    sleep 8
    NEW_URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -n1 || true)
    if [ -n "$NEW_URL" ] && [ "$NEW_URL" != "$LAST_URL" ]; then
      LAST_URL="$NEW_URL"
      curl -fsS -X POST "$SERVER/api/machines/tunnel" \
        -H "Content-Type: application/json" \
        -d "{\"connection_code\":\"$CODE\",\"tunnel_url\":\"$NEW_URL\"}" >/dev/null 2>&1 || true
    fi
  fi
done
__REMOTE_EOF__
  sed -i "s|__CODE__|$CODE|g" "$HOME/remote.sh"
  sed -i "s|__SERVER__|$SERVER|g" "$HOME/remote.sh"
  chmod +x "$HOME/remote.sh"

  # Boot-hook ook voor remote.sh
  cat > "$HOME/.termux/boot/start-vm-remote.sh" <<'__BOOT_REMOTE_EOF__'
#!/data/data/com.termux/files/usr/bin/env bash
termux-wake-lock
exec bash "$HOME/remote.sh" >> "$HOME/remote.log" 2>&1
__BOOT_REMOTE_EOF__
  chmod +x "$HOME/.termux/boot/start-vm-remote.sh"

  # Start remote.sh nu in achtergrond
  nohup bash "$HOME/remote.sh" >> "$HOME/remote.log" 2>&1 &
  echo "  OK: remote-view actief — admin kan nu live tablet bekijken"
  echo "  (zorg dat droidVNC-NG geopend is en op Start staat)"

  # Open droidVNC-NG Play Store als de app niet geïnstalleerd is
  if command -v pm >/dev/null 2>&1 && ! pm list packages 2>/dev/null | grep -q "net.christianbeier.droidvnc_ng"; then
    echo ""
    echo "  ! droidVNC-NG nog niet geïnstalleerd op deze tablet."
    echo "  ! Installeer via Play Store: net.christianbeier.droidvnc_ng"
    am start -a android.intent.action.VIEW \\
      -d "https://play.google.com/store/apps/details?id=net.christianbeier.droidvnc_ng" \\
      >/dev/null 2>&1 || true
  fi
fi

echo ""
echo "======================================"
echo "  Installatie voltooid"
echo "======================================"
echo "  Logbestand: $HOME/sync.log"
echo "  Remote log: $HOME/remote.log"
echo "  Stoppen:    pkill -f sync.sh ; pkill -f remote.sh"
echo ""
echo "  Sync start nu..."
echo ""

termux-wake-lock 2>/dev/null || true
exec bash "$HOME/sync.sh"
`
}

// -------------------------------------------------------------------------
// sync.sh payload (runs on the tablet, polls the server every 30s)
// -------------------------------------------------------------------------
// This string is injected verbatim into the installer. It uses single-quoted
// heredoc on the tablet, so NO substitution happens for ${...}, $VAR, etc.
// Only the two placeholders __CODE__ and __SERVER__ are replaced by sed.
function buildSyncScript(): string {
  return `#!/data/data/com.termux/files/usr/bin/env bash
CODE="__CODE__"
SERVER="__SERVER__"

POLL_INTERVAL=30
LOG() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

gps_folder() {
  case "$1" in
    UNICONTROL) echo "/sdcard/Unicontrol/Projects" ;;
    TRIMBLE)    echo "/sdcard/Trimble Data/Projects" ;;
    TOPCON)     echo "/sdcard/TopconData/Projects" ;;
    LEICA)      echo "/sdcard/Leica iCON/Projects" ;;
    CHCNAV)     echo "/sdcard/CHCData/Projects" ;;
    *)          echo "/sdcard/MachineFiles" ;;
  esac
}

# Whitelisted root folders: alle bestanden in deze sub-mappen worden
# gerapporteerd zodat admin overal bij kan, ongeacht waar de gebruiker
# bestanden plaatst (Downloads, screenshots, machine-specifieke folders).
SCAN_ROOTS=(
  "Download"
  "Documents"
  "Pictures"
  "DCIM"
  "MachineFiles"
  "Unicontrol"
  "Trimble Data"
  "TopconData"
  "Leica iCON"
  "CHCData"
)

# The folder we REPORT to the server (listing root). For Unicontrol this is
# one level above Projects so the UI shows the whole Unicontrol workspace.
# (Behouden voor backwards-compat met andere code paths.)
listing_folder() {
  case "$1" in
    UNICONTROL) echo "/sdcard/Unicontrol" ;;
    TRIMBLE)    echo "/sdcard/Trimble Data" ;;
    TOPCON)     echo "/sdcard/TopconData" ;;
    LEICA)      echo "/sdcard/Leica iCON" ;;
    CHCNAV)     echo "/sdcard/CHCData" ;;
    *)          echo "/sdcard/MachineFiles" ;;
  esac
}

# Minimal JSON-escape in pure bash (handles backslash, quote, newline)
json_escape() {
  local s=$1
  s=\${s//\\\\/\\\\\\\\}
  s=\${s//\\"/\\\\\\"}
  s=\${s//$'\\n'/\\\\n}
  s=\${s//$'\\r'/\\\\r}
  s=\${s//$'\\t'/\\\\t}
  printf '%s' "$s"
}

# Build a JSON object {"root":"/sdcard","files":[{"path":"sub/a/b.xml","size":123}, ...]}
# Scans alle SCAN_ROOTS sub-mappen onder /sdcard zodat de admin alle relevante
# bestanden ziet (Download, Documents, Pictures, DCIM én alle guidance-folders),
# niet alleen de map van het actieve besturingssysteem. Pad bevat de sub-mapnaam
# zodat de UI ze correct als top-level folders groepeert.
# Cap: 5000 bestanden in totaal om grote tablets niet te bevriezen.
build_listing() {
  local out='{"root":"/sdcard","files":['
  local first=1
  local count=0
  for sub in "\${SCAN_ROOTS[@]}"; do
    local dir="/sdcard/$sub"
    [ ! -d "$dir" ] && continue
    while IFS=$'\\t' read -r p sz; do
      [ -z "$p" ] && continue
      if [ $count -ge 5000 ]; then break; fi
      if [ $first -eq 1 ]; then first=0; else out+=","; fi
      local full="$sub/$p"
      out+='{"path":"'"$(json_escape "$full")"'","size":'"\${sz:-0}"'}'
      count=$((count+1))
    done < <(cd "$dir" 2>/dev/null && find . -type f -printf '%P\\t%s\\n' 2>/dev/null)
    [ $count -ge 5000 ] && break
  done
  out+=']}'
  printf '%s' "$out"
}

# Initial guidance folder (before server replies): prefer Unicontrol, else
# first existing one, else default to Unicontrol.
LAST_GS="UNICONTROL"
for G in UNICONTROL TRIMBLE TOPCON LEICA CHCNAV; do
  if [ -d "$(gps_folder "$G")" ] || [ -d "$(listing_folder "$G")" ]; then
    LAST_GS="$G"; break;
  fi
done
LAST_TGT=$(gps_folder "$LAST_GS")
LAST_LIST=$(listing_folder "$LAST_GS")
mkdir -p "$LAST_TGT" 2>/dev/null

LOG "=== VM Machine Sync ==="
LOG "Code: $CODE | Server: $SERVER"
LOG "Download-folder: $LAST_TGT"
LOG "Listing-folder:  $LAST_LIST"
LOG "Poll interval: \${POLL_INTERVAL}s"

HAS_JQ=0
command -v jq >/dev/null 2>&1 && HAS_JQ=1

# Termux:API beschikbaar?  (voor GPS-locatie)
HAS_LOC=0
command -v termux-location >/dev/null 2>&1 && HAS_LOC=1
if [ $HAS_LOC -eq 1 ]; then
  LOG "termux-location beschikbaar — GPS wordt elke ~5 min opgehaald"
else
  LOG "termux-location niet beschikbaar — installeer met: pkg install termux-api  (+ Termux:API apk)"
fi

LOC_COUNTER=0

# Probeert laatst bekende locatie op te halen uit Termux:API.
# Retourneert JSON-fragment: ,"latitude":x,"longitude":y,"accuracy":z   (of leeg)
get_location() {
  [ $HAS_LOC -ne 1 ] || [ $HAS_JQ -ne 1 ] && return
  # Laatste bekende eerst (snel, geen fix nodig) — providers: gps, network, passive
  local J=""
  for P in gps network passive; do
    J=$(timeout 8 termux-location -p "$P" -r last 2>/dev/null)
    if [ -n "$J" ] && printf '%s' "$J" | jq -e '.latitude' >/dev/null 2>&1; then break; fi
    J=""
  done
  # Fallback: vraag een verse fix (max 20s)
  if [ -z "$J" ]; then
    J=$(timeout 20 termux-location -p network 2>/dev/null)
  fi
  [ -z "$J" ] && return
  printf '%s' "$J" | jq -e '.latitude' >/dev/null 2>&1 || return
  local LAT LON ACC
  LAT=$(printf '%s' "$J" | jq -r '.latitude')
  LON=$(printf '%s' "$J" | jq -r '.longitude')
  ACC=$(printf '%s' "$J" | jq -r '.accuracy // 0')
  printf ',"latitude":%s,"longitude":%s,"accuracy":%s' "$LAT" "$LON" "$ACC"
}

while true; do
  LISTING=$(build_listing)
  [ -z "$LISTING" ] && LISTING='null'

  # Haal GPS op bij eerste poll en daarna om de ~10 polls (~5 min bij 30s interval)
  LOC_FRAG=""
  if [ $LOC_COUNTER -eq 0 ]; then
    LOC_FRAG=$(get_location)
  fi
  LOC_COUNTER=$(((LOC_COUNTER + 1) % 10))

  PAYLOAD="{\\"connection_code\\":\\"$CODE\\",\\"listing\\":$LISTING$LOC_FRAG}"
  R=$(curl -fsS --connect-timeout 10 -X POST "$SERVER/api/machines/sync" \\
      -H "Content-Type: application/json" \\
      -d "$PAYLOAD" 2>/dev/null)

  if [ -z "$R" ]; then
    LOG "Geen response — netwerk down?"
    sleep "$POLL_INTERVAL"
    continue
  fi

  # Parse guidance_system (works with or without jq)
  if [ "$HAS_JQ" = "1" ]; then
    GS=$(printf '%s' "$R" | jq -r '.guidance_system // empty' 2>/dev/null)
    N=$(printf '%s' "$R"  | jq -r '.files | length'        2>/dev/null)
  else
    GS=$(printf '%s' "$R" | grep -oE '"guidance_system"[[:space:]]*:[[:space:]]*"[A-Z]+"' \\
         | sed 's/.*"\\([A-Z][A-Z]*\\)"$/\\1/')
    N=0
  fi
  if [ -n "$GS" ]; then
    LAST_GS="$GS"
    LAST_TGT=$(gps_folder "$GS")
    LAST_LIST=$(listing_folder "$GS")
  fi
  mkdir -p "$LAST_TGT" 2>/dev/null

  if [ "$HAS_JQ" != "1" ]; then
    sleep "$POLL_INTERVAL"
    continue
  fi

  # ---------------------------------------------------------------------------
  # Commands (delete / move / pull / push) — remote control vanuit browser
  # ---------------------------------------------------------------------------
  NC=$(printf '%s' "$R" | jq -r '.commands | length' 2>/dev/null)
  if [ -n "$NC" ] && [ "$NC" != "null" ] && [ "$NC" != "0" ]; then
    LOG "$NC command(s) te verwerken"
    CRES="[]"
    for j in $(seq 0 $((NC-1))); do
      CID=$(printf '%s' "$R" | jq -r ".commands[$j].id")
      CKIND=$(printf '%s' "$R" | jq -r ".commands[$j].kind")
      CPATH=$(printf '%s' "$R" | jq -r ".commands[$j].path")
      CNEW=$(printf '%s' "$R" | jq -r ".commands[$j].new_path // empty")
      CUP=$(printf '%s' "$R" | jq -r ".commands[$j].upload_url // empty")
      CDL=$(printf '%s' "$R" | jq -r ".commands[$j].download_url // empty")

      OK=0; ERR=""
      case "$CKIND" in
        delete)
          if [ -e "$CPATH" ]; then
            rm -rf "$CPATH" 2>/tmp/vm_err && OK=1
          else OK=1; fi
          [ $OK -eq 0 ] && ERR=$(cat /tmp/vm_err 2>/dev/null)
          LOG "  delete $CPATH -> $([ $OK -eq 1 ] && echo OK || echo FAIL)"
          ;;
        move)
          mkdir -p "$(dirname "$CNEW")" 2>/dev/null
          mv -f "$CPATH" "$CNEW" 2>/tmp/vm_err && OK=1 || ERR=$(cat /tmp/vm_err 2>/dev/null)
          LOG "  move $CPATH -> $CNEW  $([ $OK -eq 1 ] && echo OK || echo FAIL)"
          ;;
        pull)
          if [ -f "$CPATH" ] && [ -n "$CUP" ]; then
            HC=$(curl -fsS --connect-timeout 60 -X PUT -w "%{http_code}" \\
                 -H "Content-Type: application/octet-stream" \\
                 --data-binary "@$CPATH" "$CUP" -o /dev/null 2>/dev/null || echo 000)
            if [ "$HC" = "200" ] || [ "$HC" = "201" ]; then OK=1
            else ERR="http $HC"; fi
          else ERR="bestand niet gevonden of geen upload url"; fi
          LOG "  pull $CPATH  $([ $OK -eq 1 ] && echo OK || echo FAIL)"
          ;;
        push)
          TARGET="$CPATH"
          if [ -n "$CDL" ]; then
            mkdir -p "$(dirname "$TARGET")" 2>/dev/null
            HC=$(curl -fsS --connect-timeout 60 -w "%{http_code}" -o "$TARGET.tmp" "$CDL" 2>/dev/null || echo 000)
            if [ "$HC" = "200" ]; then
              mv -f "$TARGET.tmp" "$TARGET" && OK=1 || ERR="mv faalde"
            else ERR="http $HC"; rm -f "$TARGET.tmp" 2>/dev/null; fi
          else ERR="geen download url"; fi
          LOG "  push $TARGET  $([ $OK -eq 1 ] && echo OK || echo FAIL)"
          ;;
        *) ERR="onbekend kind: $CKIND" ;;
      esac

      RES_STATUS=$([ $OK -eq 1 ] && echo '"done"' || echo '"failed"')
      ERR_JSON="null"
      [ -n "$ERR" ] && ERR_JSON="\\"$(printf '%s' "$ERR" | sed 's/\\\\/\\\\\\\\/g; s/"/\\\\"/g' | tr '\\n' ' ')\\""
      CRES=$(printf '%s' "$CRES" | jq ". + [{id: $CID, status: $RES_STATUS, error: $ERR_JSON}]")
    done

    curl -fsS -X PATCH "$SERVER/api/machines/sync" \\
      -H "Content-Type: application/json" \\
      -d "{\\"connection_code\\":\\"$CODE\\",\\"command_results\\":$CRES}" >/dev/null 2>&1
    LOG "Command-resultaten verstuurd"
  fi

  if [ -z "$N" ] || [ "$N" = "null" ] || [ "$N" = "0" ]; then
    sleep "$POLL_INTERVAL"
    continue
  fi

  LOG "$N bestand(en) te downloaden"
  IDS="[]"
  for i in $(seq 0 $((N-1))); do
    FID=$(printf '%s' "$R" | jq -r ".files[$i].id")
    FN=$(printf  '%s' "$R" | jq -r ".files[$i].name")
    URL=$(printf '%s' "$R" | jq -r ".files[$i].url")
    SUB=$(printf '%s' "$R" | jq -r ".files[$i].subfolder // empty")
    DST="$LAST_TGT"
    [ -n "$SUB" ] && DST="$LAST_TGT/$SUB"
    mkdir -p "$DST"
    LOG "  $FN -> $DST/"
    HC=$(curl -fsS --connect-timeout 30 -w "%{http_code}" -o "$DST/$FN" "$URL" 2>/dev/null || echo 000)
    if [ "$HC" = "200" ]; then
      LOG "    OK"
      IDS=$(printf '%s' "$IDS" | jq ". + [$FID]")
    else
      LOG "    FOUT (http $HC)"
      rm -f "$DST/$FN" 2>/dev/null
    fi
  done

  if [ "$IDS" != "[]" ]; then
    curl -fsS -X PATCH "$SERVER/api/machines/sync" \\
      -H "Content-Type: application/json" \\
      -d "{\\"connection_code\\":\\"$CODE\\",\\"transfer_ids\\":$IDS}" >/dev/null 2>&1
    LOG "Sync bevestigd"
  fi

  sleep "$POLL_INTERVAL"
done
`
}
