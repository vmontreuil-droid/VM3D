#!/bin/bash
# VM Plan & Consult — Machine File Sync
# Dit script draait op de tablet in Termux.
# Het haalt automatisch nieuwe bestanden op en zet ze in de juiste GPS-map.
#
# Gebruik:
#   bash sync.sh JOUW_CONNECTION_CODE
#
# Eenmalig installeren:
#   pkg install curl jq -y
#   chmod +x sync.sh
#   nohup bash sync.sh HTJN5JHT &

CONNECTION_CODE="$1"
if [ -z "$CONNECTION_CODE" ]; then
  echo "Gebruik: bash sync.sh CONNECTION_CODE"
  exit 1
fi

# Server URL — pas aan voor productie
SERVER="http://192.168.0.250:3000"

# GPS systeem → download folder mapping
get_target_folder() {
  local gs="$1"
  case "$gs" in
    UNICONTROL) echo "/sdcard/Unicontrol/Projects" ;;
    TRIMBLE)    echo "/sdcard/Trimble Data/Projects" ;;
    TOPCON)     echo "/sdcard/TopconData/Projects" ;;
    LEICA)      echo "/sdcard/Leica iCON/Projects" ;;
    CHCNAV)     echo "/sdcard/CHCData/Projects" ;;
    *)          echo "/sdcard/MachineFiles" ;;
  esac
}

echo "=== VM Machine Sync ==="
echo "Connection code: $CONNECTION_CODE"
echo "Server: $SERVER"
echo "Checking every 30 seconds..."
echo ""

# JSON-escape helper (pure bash, no jq needed)
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
  [ -z "$root" ] || [ ! -d "$root" ] && { printf 'null'; return; }
  local out='{"root":"'"$(json_escape "$root")"'","files":['
  local first=1
  local count=0
  while IFS=$'\t' read -r p sz; do
    [ -z "$p" ] && continue
    [ $count -ge 5000 ] && break
    if [ $first -eq 1 ]; then first=0; else out+=","; fi
    out+='{"path":"'"$(json_escape "$p")"'","size":'"${sz:-0}"'}'
    count=$((count+1))
  done < <(cd "$root" 2>/dev/null && find . -type f -printf '%P\t%s\n' 2>/dev/null)
  out+=']}'
  printf '%s' "$out"
}

# Best-effort guess if nothing known yet
LAST_TARGET=""
for GUESS in UNICONTROL TRIMBLE TOPCON LEICA CHCNAV; do
  F=$(get_target_folder "$GUESS")
  if [ -d "$F" ]; then LAST_TARGET="$F"; break; fi
done
echo "Listing start-folder: ${LAST_TARGET:-onbekend}"

while true; do
  # Build directory listing for current guidance folder (no jq required)
  LISTING_JSON=$(build_listing "$LAST_TARGET")
  [ -z "$LISTING_JSON" ] && LISTING_JSON="null"

  # Vraag pending bestanden op (en stuur heartbeat + listing tegelijk)
  RESPONSE=$(curl -s -X POST "$SERVER/api/machines/sync" \
    -H "Content-Type: application/json" \
    -d "{\"connection_code\":\"$CONNECTION_CODE\",\"listing\":$LISTING_JSON}" 2>/dev/null)

  if [ -z "$RESPONSE" ]; then
    sleep 30
    continue
  fi

  # Parse guidance system en aantal bestanden
  GUIDANCE=$(echo "$RESPONSE" | jq -r '.guidance_system // empty')
  FILE_COUNT=$(echo "$RESPONSE" | jq '.files | length')

  # Update target folder if server tells us which guidance system
  if [ -n "$GUIDANCE" ]; then
    LAST_TARGET=$(get_target_folder "$GUIDANCE")
  fi

  if [ "$FILE_COUNT" = "0" ] || [ -z "$FILE_COUNT" ]; then
    sleep 30
    continue
  fi

  TARGET_FOLDER="$LAST_TARGET"
  mkdir -p "$TARGET_FOLDER"

  echo "[$(date '+%H:%M:%S')] $FILE_COUNT nieuw(e) bestand(en) gevonden"

  SYNCED_IDS="[]"

  for i in $(seq 0 $((FILE_COUNT - 1))); do
    FILE_ID=$(echo "$RESPONSE" | jq -r ".files[$i].id")
    FILE_NAME=$(echo "$RESPONSE" | jq -r ".files[$i].name")
    FILE_URL=$(echo "$RESPONSE" | jq -r ".files[$i].url")
    SUBFOLDER=$(echo "$RESPONSE" | jq -r ".files[$i].subfolder // empty")

    # Determine target path (with optional werf subfolder)
    if [ -n "$SUBFOLDER" ]; then
      DEST="$TARGET_FOLDER/$SUBFOLDER"
    else
      DEST="$TARGET_FOLDER"
    fi
    mkdir -p "$DEST"

    echo "  Downloading: $FILE_NAME → $DEST/"

    # Download het bestand
    HTTP_CODE=$(curl -s -w "%{http_code}" -o "$DEST/$FILE_NAME" "$FILE_URL" 2>/dev/null)

    if [ "$HTTP_CODE" = "200" ]; then
      echo "  ✓ $FILE_NAME opgeslagen"
      SYNCED_IDS=$(echo "$SYNCED_IDS" | jq ". + [$FILE_ID]")
    else
      echo "  ✗ Download mislukt ($HTTP_CODE)"
    fi
  done

  # Bevestig sync aan server
  if [ "$SYNCED_IDS" != "[]" ]; then
    curl -s -X PATCH "$SERVER/api/machines/sync" \
      -H "Content-Type: application/json" \
      -d "{\"connection_code\":\"$CONNECTION_CODE\",\"transfer_ids\":$SYNCED_IDS}" >/dev/null 2>&1
    echo "  Sync bevestigd"
  fi

  sleep 30
done
