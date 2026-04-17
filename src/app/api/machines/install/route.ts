import { NextRequest, NextResponse } from 'next/server'

// Complete installer voor tablet — één commando doet alles
// Gebruik: wget -qO- "http://SERVER/api/machines/install?code=XXXX" | bash
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code || code.length < 4) {
    return new NextResponse('echo "FOUT: geen connection code"\necho "Gebruik: wget -qO- URL?code=JOUWCODE | bash"\nexit 1\n', {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const host = req.headers.get('host') || 'localhost:3000'
  const proto = req.headers.get('x-forwarded-proto') || 'http'
  const serverUrl = `${proto}://${host}`

  const script = generateInstallScript(code, serverUrl)

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}

function generateInstallScript(code: string, server: string): string {
  return `#!/bin/bash
# VM Plan & Consult — Machine Sync Installer
# Automatische installatie voor Termux

CODE="${code}"
SERVER="${server}"

echo ""
echo "==================================="
echo "  VM Machine Sync — Installatie"
echo "==================================="
echo "  Code: $CODE"
echo "  Server: $SERVER"
echo ""

# Stap 1: Storage toegang
echo "[1/4] Storage toegang..."
termux-setup-storage 2>/dev/null || true

# Stap 2: Repos fixen + updaten
echo "[2/4] Packages updaten (stabiele mirror forceren)..."
mkdir -p $PREFIX/etc/apt
# Forceer Cloudflare-mirror; andere zijn soms stuk of gedeeltelijk gesynchroniseerd
cat > $PREFIX/etc/apt/sources.list << 'SRC'
deb https://packages-cf.termux.dev/apt/termux-main stable main
SRC
# Probeer meerdere mirrors als CF niet wil
MIRRORS=(
  "https://packages-cf.termux.dev/apt/termux-main"
  "https://packages.termux.dev/apt/termux-main"
  "https://grimler.se/termux/termux-main"
)
UPDATED=0
for M in "\${MIRRORS[@]}"; do
  echo "deb $M stable main" > $PREFIX/etc/apt/sources.list
  if apt update -o Acquire::Retries=2 2>&1 | tail -n 3; then
    if apt-cache show jq >/dev/null 2>&1; then
      echo "  OK: mirror werkt -> $M"
      UPDATED=1
      break
    fi
  fi
done
[ "$UPDATED" = "0" ] && echo "  WAARSCHUWING: geen werkende mirror gevonden"
dpkg --configure -a 2>/dev/null

# Stap 3: Dependencies
echo "[3/4] curl en jq installeren..."
apt install -y --no-install-recommends curl jq 2>&1 | tail -n 5

if ! command -v curl &>/dev/null; then
  echo "FOUT: curl installatie mislukt"
  exit 1
fi
echo "  OK: curl werkt"
if ! command -v jq &>/dev/null; then
  echo "  WAARSCHUWING: jq ontbreekt — listing wordt in pure bash gemaakt"
fi

# Test verbinding
echo "  Verbinding testen..."
HB=$(curl -s --connect-timeout 5 "$SERVER/api/machines/heartbeat" 2>/dev/null)
if [ -z "$HB" ]; then
  echo "  FOUT: kan server niet bereiken"
  echo "  Check wifi verbinding"
  exit 1
fi
echo "  OK: verbinding werkt"

# Stap 4: Sync script
echo "[4/4] Sync script installeren..."

cat > $HOME/sync.sh << 'SCRIPT'
#!/bin/bash
CODE="%%CODE%%"
SERVER="%%SERVER%%"

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

# Escape a string for JSON (pure bash, no jq needed)
json_escape() {
  local s=$1
  s=\${s//\\\\/\\\\\\\\}
  s=\${s//\\"/\\\\\\"}
  s=\${s//$'\\n'/\\\\n}
  s=\${s//$'\\r'/\\\\r}
  s=\${s//$'\\t'/\\\\t}
  printf '%s' "$s"
}

# Build a JSON listing of a folder, recursively, pure bash (no jq)
build_listing() {
  local root="$1"
  [ -z "$root" ] || [ ! -d "$root" ] && { printf 'null'; return; }
  local out='{"root":"'"$(json_escape "$root")"'","files":['
  local first=1
  local count=0
  while IFS=$'\\t' read -r p sz; do
    [ -z "$p" ] && continue
    [ $count -ge 5000 ] && break
    if [ $first -eq 1 ]; then first=0; else out+=","; fi
    out+='{"path":"'"$(json_escape "$p")"'","size":'"\${sz:-0}"'}'
    count=$((count+1))
  done < <(cd "$root" 2>/dev/null && find . -type f -printf '%P\\t%s\\n' 2>/dev/null)
  out+=']}'
  printf '%s' "$out"
}

# Default guess based on which guidance folder exists right now
LAST_TGT=""
for GUESS in UNICONTROL TRIMBLE TOPCON LEICA CHCNAV; do
  F=$(gps_folder "$GUESS")
  if [ -d "$F" ]; then LAST_TGT="$F"; break; fi
done

echo "=== VM Machine Sync ==="
echo "Code: $CODE | Server: $SERVER"
echo "Listing start-folder: \${LAST_TGT:-onbekend}"
echo "Check elke 30s op nieuwe bestanden..."
echo ""

while true; do
  # Build directory listing of current guidance folder
  LISTING=$(build_listing "$LAST_TGT")
  [ -z "$LISTING" ] && LISTING="null"

  R=$(curl -s --connect-timeout 10 -X POST "$SERVER/api/machines/sync" \\
    -H "Content-Type: application/json" \\
    -d "{\\"connection_code\\":\\"$CODE\\",\\"listing\\":$LISTING}" 2>/dev/null)

  [ -z "$R" ] && sleep 30 && continue

  if command -v jq >/dev/null 2>&1; then
    GS=$(echo "$R" | jq -r '.guidance_system // empty')
  else
    GS=$(echo "$R" | grep -oE '"guidance_system"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"\\([A-Z]*\\)"$/\\1/')
  fi
  [ -n "$GS" ] && LAST_TGT=$(gps_folder "$GS")

  if ! command -v jq >/dev/null 2>&1; then
    # No jq -> can't parse file list, just keep sending listing + sleep
    sleep 30
    continue
  fi

  N=$(echo "$R" | jq '.files | length' 2>/dev/null)
  [ "$N" = "0" ] || [ -z "$N" ] || [ "$N" = "null" ] && sleep 30 && continue

  TGT="$LAST_TGT"
  echo "[$(date '+%H:%M:%S')] $N bestand(en) gevonden"

  IDS="[]"
  for i in $(seq 0 $((N-1))); do
    FID=$(echo "$R" | jq -r ".files[$i].id")
    FN=$(echo "$R" | jq -r ".files[$i].name")
    URL=$(echo "$R" | jq -r ".files[$i].url")
    SUB=$(echo "$R" | jq -r ".files[$i].subfolder // empty")
    DST="$TGT"; [ -n "$SUB" ] && DST="$TGT/$SUB"
    mkdir -p "$DST"
    echo "  $FN -> $DST/"
    HC=$(curl -s --connect-timeout 30 -w "%{http_code}" -o "$DST/$FN" "$URL" 2>/dev/null)
    if [ "$HC" = "200" ]; then
      echo "  OK"
      IDS=$(echo "$IDS" | jq ". + [$FID]")
    else
      echo "  FOUT ($HC)"
    fi
  done

  if [ "$IDS" != "[]" ]; then
    curl -s -X PATCH "$SERVER/api/machines/sync" \\
      -H "Content-Type: application/json" \\
      -d "{\\"connection_code\\":\\"$CODE\\",\\"transfer_ids\\":$IDS}" >/dev/null 2>&1
    echo "  Sync OK"
  fi
  sleep 30
done
SCRIPT

sed -i "s|%%CODE%%|$CODE|g" $HOME/sync.sh
sed -i "s|%%SERVER%%|$SERVER|g" $HOME/sync.sh
chmod +x $HOME/sync.sh

# Auto-start bij boot
mkdir -p $HOME/.termux/boot
cat > $HOME/.termux/boot/start-sync.sh << BOOT
#!/bin/bash
termux-wake-lock
bash $HOME/sync.sh
BOOT
chmod +x $HOME/.termux/boot/start-sync.sh

echo ""
echo "==================================="
echo "  Installatie voltooid!"
echo "==================================="
echo ""
echo "  Sync start nu automatisch..."
echo "  CTRL+C om te stoppen"
echo ""

exec bash $HOME/sync.sh
`
}
