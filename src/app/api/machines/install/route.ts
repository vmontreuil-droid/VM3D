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
echo "[2/4] Packages updaten..."
mkdir -p $PREFIX/etc/apt
cat > $PREFIX/etc/apt/sources.list << 'SRC'
deb https://packages-cf.termux.dev/apt/termux-main stable main
SRC
apt update -y
echo "  Volledige upgrade..."
yes | apt full-upgrade -y
dpkg --configure -a 2>/dev/null

# Stap 3: Dependencies
echo "[3/4] curl en jq installeren..."
apt install -y curl jq

if ! command -v curl &>/dev/null; then
  echo "FOUT: curl installatie mislukt"
  exit 1
fi
echo "  OK: curl werkt"

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

echo "=== VM Machine Sync ==="
echo "Code: $CODE | Server: $SERVER"
echo "Check elke 30s op nieuwe bestanden..."
echo ""

while true; do
  # Build directory listing of last-known guidance folder
  LISTING="null"
  if [ -n "$LAST_TGT" ] && [ -d "$LAST_TGT" ]; then
    LISTING=$(
      cd "$LAST_TGT" 2>/dev/null && \
      find . -maxdepth 2 -type f -printf '%P\\t%s\\n' 2>/dev/null | \
      jq -Rsc --arg root "$LAST_TGT" '
        split("\\n") | map(select(length>0)) |
        map(split("\\t") | {path: .[0], size: (.[1]|tonumber? // 0)}) |
        group_by(.path | split("/") | if length>1 then .[0] else "" end) |
        map({
          name: (.[0].path | split("/") | if length>1 then .[0] else "" end),
          files: map({name: (.path|split("/")|last), size: .size})
        }) |
        {root: $root, werven: .}
      ' 2>/dev/null || echo "null"
    )
    [ -z "$LISTING" ] && LISTING="null"
  fi

  R=$(curl -s --connect-timeout 10 -X POST "$SERVER/api/machines/sync" \\
    -H "Content-Type: application/json" \\
    -d "{\\"connection_code\\":\\"$CODE\\",\\"listing\\":$LISTING}" 2>/dev/null)

  [ -z "$R" ] && sleep 30 && continue

  GS=$(echo "$R" | jq -r '.guidance_system // empty')
  [ -n "$GS" ] && LAST_TGT=$(gps_folder "$GS")

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
