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

while true; do
  # Build directory listing for current guidance folder (best-effort)
  PREV_GUIDANCE_FOLDER=${LAST_TARGET:-""}
  LISTING_JSON="null"
  if [ -n "$PREV_GUIDANCE_FOLDER" ] && [ -d "$PREV_GUIDANCE_FOLDER" ]; then
    # Produce {"root": "...", "files": [{"path": "Werf1/sub/file.xml", "size": 1234}]}
    # Fully recursive — every file under the guidance folder.
    LISTING_JSON=$(
      cd "$PREV_GUIDANCE_FOLDER" 2>/dev/null && \
      find . -type f -printf '%P\t%s\n' 2>/dev/null | head -n 5000 | \
      jq -Rsc --arg root "$PREV_GUIDANCE_FOLDER" '
        split("\n") | map(select(length>0)) |
        map(split("\t") | {path: .[0], size: (.[1]|tonumber? // 0)}) |
        {root: $root, files: .}
      ' 2>/dev/null || echo "null"
    )
    [ -z "$LISTING_JSON" ] && LISTING_JSON="null"
  fi

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

  if [ "$FILE_COUNT" = "0" ] || [ -z "$FILE_COUNT" ]; then
    sleep 30
    continue
  fi

  TARGET_FOLDER=$(get_target_folder "$GUIDANCE")
  LAST_TARGET="$TARGET_FOLDER"
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
