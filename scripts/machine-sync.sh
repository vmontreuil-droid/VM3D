#!/data/data/com.termux/files/usr/bin/env bash
# VM Plan & Consult — Machine File Sync
# Draait op een Android-tablet in Termux. Polt de server elke 30s.
#
# Gebruik:
#   bash sync.sh JOUW_CONNECTION_CODE [http://server:3000]

set -u

CODE="${1:-}"
SERVER="${2:-http://192.168.0.250:3000}"
if [ -z "$CODE" ]; then
  echo "Gebruik: bash sync.sh CONNECTION_CODE [SERVER_URL]"
  exit 1
fi

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

json_escape() {
  local s=$1
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  s=${s//$'\n'/\\n}
  s=${s//$'\r'/\\r}
  s=${s//$'\t'/\\t}
  printf '%s' "$s"
}

build_listing() {
  local root="$1"
  if [ -z "$root" ]; then printf 'null'; return; fi
  mkdir -p "$root" 2>/dev/null
  local out='{"root":"'"$(json_escape "$root")"'","files":['
  local first=1
  local count=0
  while IFS=$'\t' read -r p sz; do
    [ -z "$p" ] && continue
    if [ $count -ge 5000 ]; then break; fi
    if [ $first -eq 1 ]; then first=0; else out+=","; fi
    out+='{"path":"'"$(json_escape "$p")"'","size":'"${sz:-0}"'}'
    count=$((count+1))
  done < <(cd "$root" 2>/dev/null && find . -type f -printf '%P\t%s\n' 2>/dev/null)
  out+=']}'
  printf '%s' "$out"
}

LAST_TGT="/sdcard/Unicontrol/Projects"
for G in UNICONTROL TRIMBLE TOPCON LEICA CHCNAV; do
  F=$(gps_folder "$G")
  if [ -d "$F" ]; then LAST_TGT="$F"; break; fi
done
mkdir -p "$LAST_TGT" 2>/dev/null

LOG "=== VM Machine Sync ==="
LOG "Code: $CODE | Server: $SERVER"
LOG "Start-folder: $LAST_TGT"
LOG "Poll interval: ${POLL_INTERVAL}s"

HAS_JQ=0
command -v jq >/dev/null 2>&1 && HAS_JQ=1

while true; do
  LISTING=$(build_listing "$LAST_TGT")
  [ -z "$LISTING" ] && LISTING='null'

  PAYLOAD="{\"connection_code\":\"$CODE\",\"listing\":$LISTING}"
  R=$(curl -fsS --connect-timeout 10 -X POST "$SERVER/api/machines/sync" \
      -H "Content-Type: application/json" \
      -d "$PAYLOAD" 2>/dev/null)

  if [ -z "$R" ]; then
    LOG "Geen response — netwerk down?"
    sleep "$POLL_INTERVAL"
    continue
  fi

  if [ "$HAS_JQ" = "1" ]; then
    GS=$(printf '%s' "$R" | jq -r '.guidance_system // empty' 2>/dev/null)
    N=$(printf '%s' "$R"  | jq -r '.files | length'          2>/dev/null)
  else
    GS=$(printf '%s' "$R" | grep -oE '"guidance_system"[[:space:]]*:[[:space:]]*"[A-Z]+"' \
         | sed 's/.*"\([A-Z][A-Z]*\)"$/\1/')
    N=0
  fi
  [ -n "$GS" ] && LAST_TGT=$(gps_folder "$GS")
  mkdir -p "$LAST_TGT" 2>/dev/null

  if [ "$HAS_JQ" != "1" ]; then
    sleep "$POLL_INTERVAL"
    continue
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
    curl -fsS -X PATCH "$SERVER/api/machines/sync" \
      -H "Content-Type: application/json" \
      -d "{\"connection_code\":\"$CODE\",\"transfer_ids\":$IDS}" >/dev/null 2>&1
    LOG "Sync bevestigd"
  fi

  sleep "$POLL_INTERVAL"
done
