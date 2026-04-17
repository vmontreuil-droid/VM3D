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
echo "[3/5] curl + jq installeren..."
if [ -n "$WORKING_MIRROR" ]; then
  apt install -y --no-install-recommends curl jq >/dev/null 2>&1 || true
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

echo ""
echo "======================================"
echo "  Installatie voltooid"
echo "======================================"
echo "  Logbestand: $HOME/sync.log"
echo "  Stoppen:    pkill -f sync.sh"
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

# The folder we REPORT to the server (listing root). For Unicontrol this is
# one level above Projects so the UI shows the whole Unicontrol workspace.
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

# Build a JSON object {"root":"...","files":[{"path":"a/b.xml","size":123}, ...]}
# Recursive, pure bash (jq not required). Capped at 5000 files.
build_listing() {
  local root="$1"
  if [ -z "$root" ]; then printf 'null'; return; fi
  mkdir -p "$root" 2>/dev/null
  local out='{"root":"'"$(json_escape "$root")"'","files":['
  local first=1
  local count=0
  while IFS=$'\\t' read -r p sz; do
    [ -z "$p" ] && continue
    if [ $count -ge 5000 ]; then break; fi
    if [ $first -eq 1 ]; then first=0; else out+=","; fi
    out+='{"path":"'"$(json_escape "$p")"'","size":'"\${sz:-0}"'}'
    count=$((count+1))
  done < <(cd "$root" 2>/dev/null && find . -type f -printf '%P\\t%s\\n' 2>/dev/null)
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

while true; do
  LISTING=$(build_listing "$LAST_LIST")
  [ -z "$LISTING" ] && LISTING='null'

  PAYLOAD="{\\"connection_code\\":\\"$CODE\\",\\"listing\\":$LISTING}"
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
