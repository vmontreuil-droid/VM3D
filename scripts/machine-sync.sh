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
LOG "Poll interval: ${POLL_INTERVAL}s"

HAS_JQ=0
command -v jq >/dev/null 2>&1 && HAS_JQ=1

HAS_LOC=0
command -v termux-location >/dev/null 2>&1 && HAS_LOC=1
if [ $HAS_LOC -eq 1 ]; then
  LOG "termux-location beschikbaar — GPS wordt elke ~5 min opgehaald"
else
  LOG "termux-location niet beschikbaar — installeer: pkg install termux-api  (+ Termux:API apk)"
fi
LOC_COUNTER=0

get_location() {
  [ $HAS_LOC -ne 1 ] || [ $HAS_JQ -ne 1 ] && return
  local J=""
  for P in gps network passive; do
    J=$(timeout 8 termux-location -p "$P" -r last 2>/dev/null)
    if [ -n "$J" ] && printf '%s' "$J" | jq -e '.latitude' >/dev/null 2>&1; then break; fi
    J=""
  done
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
  LISTING=$(build_listing "$LAST_LIST")
  [ -z "$LISTING" ] && LISTING='null'

  LOC_FRAG=""
  if [ $LOC_COUNTER -eq 0 ]; then
    LOC_FRAG=$(get_location)
  fi
  LOC_COUNTER=$(((LOC_COUNTER + 1) % 10))

  PAYLOAD="{\"connection_code\":\"$CODE\",\"listing\":$LISTING$LOC_FRAG}"
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
