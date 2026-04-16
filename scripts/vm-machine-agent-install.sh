#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  VM Plan & Consult — Machine Agent Installer voor Android
# ============================================================
#  
#  Stap 1: Installeer Termux uit F-Droid (NIET Play Store!)
#          https://f-droid.org/en/packages/com.termux/
#  
#  Stap 2: Open Termux en plak dit commando:
#          curl -sL https://vmplanconsult.be/agent/install.sh | bash
#  
#  OF kopieer dit bestand naar de tablet en run:
#          bash vm-machine-agent-install.sh
#
#  Wat wordt geïnstalleerd:
#   - Python + Flask (file agent)
#   - websockify + x11vnc (scherm delen)  
#   - Auto-start bij boot via Termux:Boot
#
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  VM Plan & Consult — Machine Agent      ║${NC}"
echo -e "${GREEN}║  Installer voor Android/Termux           ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""

# -----------------------------------------------------------
# 1. Termux packages
# -----------------------------------------------------------
echo -e "${YELLOW}[1/5]${NC} Systeem pakketten installeren..."
pkg update -y
pkg install -y python termux-api

# -----------------------------------------------------------
# 2. Python packages
# -----------------------------------------------------------
echo -e "${YELLOW}[2/5]${NC} Python packages installeren..."
pip install flask flask-cors websockets

# -----------------------------------------------------------
# 3. Opslagrechten
# -----------------------------------------------------------
echo -e "${YELLOW}[3/5]${NC} Opslagrechten aanvragen..."
termux-setup-storage || true
sleep 2

# -----------------------------------------------------------
# 4. Machine Agent script
# -----------------------------------------------------------
echo -e "${YELLOW}[4/5]${NC} Machine Agent installeren..."

AGENT_DIR="$HOME/vm-agent"
mkdir -p "$AGENT_DIR"

cat > "$AGENT_DIR/agent.py" << 'AGENT_EOF'
"""
VM Plan & Consult — Machine File Agent (Android/Termux)
"""
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path, PurePosixPath

from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ROOT_DIR = None
API_KEY = None

def safe_path(rel_path: str) -> Path:
    clean = PurePosixPath(rel_path.replace("\\", "/"))
    parts = [p for p in clean.parts if p not in ("/", "\\", "..")]
    resolved = ROOT_DIR.joinpath(*parts).resolve()
    if not str(resolved).startswith(str(ROOT_DIR)):
        abort(403, "Toegang geweigerd")
    return resolved

def check_api_key():
    if not API_KEY:
        return
    key = request.headers.get("X-API-Key", "")
    if key != API_KEY:
        abort(401, "Ongeldige API-sleutel")

def file_info(path: Path, rel_to: Path) -> dict:
    stat = path.stat()
    rel = str(path.relative_to(rel_to)).replace("\\", "/")
    return {
        "name": path.name,
        "path": rel,
        "is_dir": path.is_dir(),
        "size": stat.st_size if path.is_file() else None,
        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "extension": path.suffix.lower() if path.is_file() else None,
    }

@app.before_request
def before_request():
    check_api_key()

@app.route("/health", methods=["GET"])
def health():
    import socket
    return jsonify({
        "status": "ok",
        "root": str(ROOT_DIR),
        "hostname": socket.gethostname(),
        "platform": "android",
    })

@app.route("/files", methods=["GET"])
def list_files():
    rel_path = request.args.get("path", "")
    target = safe_path(rel_path) if rel_path else ROOT_DIR
    if not target.exists():
        abort(404, f"Map niet gevonden: {rel_path}")
    if not target.is_dir():
        abort(400, f"Geen map: {rel_path}")
    items = []
    try:
        for entry in sorted(target.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
            if entry.name.startswith(".") or entry.name.startswith("$"):
                continue
            try:
                items.append(file_info(entry, ROOT_DIR))
            except (PermissionError, OSError):
                continue
    except PermissionError:
        abort(403, "Geen toegang")
    return jsonify({"path": rel_path or "/", "items": items, "count": len(items)})

@app.route("/files/tree", methods=["GET"])
def file_tree():
    rel_path = request.args.get("path", "")
    max_depth = min(int(request.args.get("depth", 3)), 5)
    target = safe_path(rel_path) if rel_path else ROOT_DIR
    if not target.exists() or not target.is_dir():
        abort(404, "Map niet gevonden")
    def build_tree(dir_path: Path, depth: int) -> list:
        if depth <= 0:
            return []
        result = []
        try:
            for entry in sorted(dir_path.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
                if entry.name.startswith(".") or entry.name.startswith("$"):
                    continue
                try:
                    node = file_info(entry, ROOT_DIR)
                    if entry.is_dir():
                        node["children"] = build_tree(entry, depth - 1)
                    result.append(node)
                except (PermissionError, OSError):
                    continue
        except PermissionError:
            pass
        return result
    return jsonify({"path": rel_path or "/", "tree": build_tree(target, max_depth)})

@app.route("/files/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        abort(400, "Geen bestand")
    file = request.files["file"]
    if not file.filename:
        abort(400, "Geen bestandsnaam")
    target_dir = request.form.get("path", "")
    dir_path = safe_path(target_dir) if target_dir else ROOT_DIR
    dir_path.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename).name
    target_file = dir_path / safe_name
    if target_file.exists() and not request.form.get("overwrite"):
        abort(409, f"Bestand bestaat al: {safe_name}")
    file.save(str(target_file))
    return jsonify({"status": "ok", "file": file_info(target_file, ROOT_DIR)})

@app.route("/files/upload-multiple", methods=["POST"])
def upload_multiple():
    files = request.files.getlist("files")
    if not files:
        abort(400, "Geen bestanden")
    target_dir = request.form.get("path", "")
    dir_path = safe_path(target_dir) if target_dir else ROOT_DIR
    dir_path.mkdir(parents=True, exist_ok=True)
    results = []
    for file in files:
        if not file.filename:
            continue
        safe_name = Path(file.filename).name
        target_file = dir_path / safe_name
        file.save(str(target_file))
        results.append(file_info(target_file, ROOT_DIR))
    return jsonify({"status": "ok", "files": results, "count": len(results)})

@app.route("/files/mkdir", methods=["POST"])
def create_directory():
    data = request.get_json()
    if not data or not data.get("path"):
        abort(400, "Pad is vereist")
    dir_path = safe_path(data["path"])
    dir_path.mkdir(parents=True, exist_ok=True)
    return jsonify({"status": "ok", "path": str(dir_path.relative_to(ROOT_DIR)).replace("\\", "/")})

@app.route("/files/download", methods=["GET"])
def download_file():
    rel_path = request.args.get("path", "")
    if not rel_path:
        abort(400, "Pad is vereist")
    file_path = safe_path(rel_path)
    if not file_path.exists() or not file_path.is_file():
        abort(404, "Bestand niet gevonden")
    return send_file(str(file_path), as_attachment=True, download_name=file_path.name)

@app.route("/files/delete", methods=["DELETE"])
def delete_file():
    data = request.get_json()
    if not data or not data.get("path"):
        abort(400, "Pad is vereist")
    file_path = safe_path(data["path"])
    if not file_path.exists():
        abort(404, "Bestand niet gevonden")
    if file_path.is_dir():
        abort(400, "Kan geen mappen verwijderen via API")
    file_path.unlink()
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VM Machine File Agent (Android)")
    parser.add_argument("--port", type=int, default=6081)
    parser.add_argument("--root", type=str, default=None)
    parser.add_argument("--api-key", type=str, default=None)
    args = parser.parse_args()

    # Android storage paths
    if args.root:
        ROOT_DIR = Path(args.root).resolve()
    else:
        # Try common Android paths
        for p in ["/sdcard/Werven", "/storage/emulated/0/Werven", os.path.expanduser("~/storage/shared/Werven")]:
            candidate = Path(p)
            if candidate.parent.exists():
                ROOT_DIR = candidate
                break
        if ROOT_DIR is None:
            ROOT_DIR = Path(os.path.expanduser("~/storage/shared/Werven"))

    ROOT_DIR.mkdir(parents=True, exist_ok=True)
    API_KEY = args.api_key

    print(f"")
    print(f"  VM Machine File Agent (Android)")
    print(f"  ================================")
    print(f"  Root:  {ROOT_DIR}")
    print(f"  Poort: {args.port}")
    print(f"  URL:   http://0.0.0.0:{args.port}")
    print(f"")

    app.run(host="0.0.0.0", port=args.port, debug=False)
AGENT_EOF

# VNC WebSocket Proxy (vervangt websockify, geen numpy nodig)
cat > "$AGENT_DIR/vnc-proxy.py" << 'PROXY_EOF'
"""
Lightweight WebSocket-to-VNC TCP proxy
Replaces websockify — no numpy dependency
Bridges noVNC (browser WebSocket) to VNC server (TCP)
"""
import asyncio
import argparse
import signal
import sys

try:
    import websockets
    from websockets.legacy.server import serve
except ImportError:
    print("ERROR: websockets package niet gevonden. Run: pip install websockets")
    sys.exit(1)

VNC_HOST = "127.0.0.1"
VNC_PORT = 5900

async def proxy_handler(websocket, path=None):
    """Handle one noVNC WebSocket connection, proxy to VNC TCP"""
    try:
        reader, writer = await asyncio.open_connection(VNC_HOST, VNC_PORT)
    except (ConnectionRefusedError, OSError) as e:
        print(f"  ❌ VNC server niet bereikbaar op {VNC_HOST}:{VNC_PORT} — start droidVNC-NG!")
        await websocket.close(1011, "VNC server niet beschikbaar")
        return

    print(f"  🔗 Nieuwe VNC sessie: {websocket.remote_address}")

    async def ws_to_tcp():
        try:
            async for message in websocket:
                if isinstance(message, bytes):
                    writer.write(message)
                    await writer.drain()
        except Exception:
            pass
        finally:
            writer.close()

    async def tcp_to_ws():
        try:
            while True:
                data = await reader.read(65536)
                if not data:
                    break
                await websocket.send(data)
        except Exception:
            pass
        finally:
            await websocket.close()

    await asyncio.gather(ws_to_tcp(), tcp_to_ws())
    print(f"  🔌 VNC sessie afgesloten: {websocket.remote_address}")

async def main(listen_port):
    print(f"  VNC WebSocket Proxy: 0.0.0.0:{listen_port} → {VNC_HOST}:{VNC_PORT}")

    stop = asyncio.get_event_loop().create_future()

    def shutdown():
        if not stop.done():
            stop.set_result(True)
    
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            asyncio.get_event_loop().add_signal_handler(sig, shutdown)
        except NotImplementedError:
            pass

    async with serve(
        proxy_handler,
        "0.0.0.0",
        listen_port,
        subprotocols=["binary"],
        max_size=2**23,
        ping_interval=30,
        ping_timeout=10,
    ) as server:
        await stop

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--listen-port", type=int, default=6080)
    parser.add_argument("--vnc-port", type=int, default=5900)
    args = parser.parse_args()
    VNC_PORT = args.vnc_port
    asyncio.run(main(args.listen_port))
PROXY_EOF

# -----------------------------------------------------------
# 5. Start script + auto-boot
# -----------------------------------------------------------
echo -e "${YELLOW}[5/5]${NC} Startscript en auto-boot configureren..."

# Main start script
cat > "$AGENT_DIR/start.sh" << 'START_EOF'
#!/data/data/com.termux/files/usr/bin/bash
echo ""
echo "  VM Machine Agent starten..."
echo ""

# Start file agent op poort 6081
python ~/vm-agent/agent.py --port 6081 &
AGENT_PID=$!

# Start websocket-to-VNC proxy op poort 6080
# Dit verbindt noVNC in de browser met de VNC server (droidVNC-NG)
python ~/vm-agent/vnc-proxy.py --listen-port 6080 --vnc-port 5900 &
VNC_PROXY_PID=$!

LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost')

echo ""
echo "  ✅ File Agent draait op poort 6081 (PID: $AGENT_PID)"
echo "  ✅ VNC Proxy  draait op poort 6080 (PID: $VNC_PROXY_PID)"
echo ""
echo "  📂 Werven map: ~/storage/shared/Werven"
echo "  🌐 File API:   http://${LOCAL_IP}:6081"
echo "  🖥  VNC Proxy:  ws://${LOCAL_IP}:6080"
echo ""
echo "  ⚠️  Vergeet niet droidVNC-NG te starten voor scherm delen!"
echo "  Druk Ctrl+C om te stoppen"
echo ""

trap "kill $AGENT_PID $VNC_PROXY_PID 2>/dev/null" EXIT
wait $AGENT_PID $VNC_PROXY_PID
START_EOF
chmod +x "$AGENT_DIR/start.sh"

# Stop script
cat > "$AGENT_DIR/stop.sh" << 'STOP_EOF'
#!/data/data/com.termux/files/usr/bin/bash
echo "VM Machine Agent stoppen..."
pkill -f "agent.py" 2>/dev/null
pkill -f "vnc-proxy.py" 2>/dev/null
echo "Gestopt."
STOP_EOF
chmod +x "$AGENT_DIR/stop.sh"

# Termux:Boot auto-start (als Termux:Boot geïnstalleerd is)
BOOT_DIR="$HOME/.termux/boot"
mkdir -p "$BOOT_DIR"
cat > "$BOOT_DIR/vm-agent-autostart.sh" << 'BOOT_EOF'
#!/data/data/com.termux/files/usr/bin/bash
# Auto-start VM Machine Agent bij boot
termux-wake-lock
python ~/vm-agent/agent.py --port 6081 &
python ~/vm-agent/vnc-proxy.py --listen-port 6080 --vnc-port 5900 &
BOOT_EOF
chmod +x "$BOOT_DIR/vm-agent-autostart.sh"

# Shortcut alias
echo 'alias vm-start="bash ~/vm-agent/start.sh"' >> "$HOME/.bashrc"
echo 'alias vm-stop="bash ~/vm-agent/stop.sh"' >> "$HOME/.bashrc"

# Maak werven map aan
mkdir -p "$HOME/storage/shared/Werven"

# -----------------------------------------------------------
# Klaar!
# -----------------------------------------------------------
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Installatie voltooid!                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${YELLOW}Starten:${NC}  vm-start"
echo -e "  ${YELLOW}Stoppen:${NC}  vm-stop"
echo ""
echo -e "  ${YELLOW}Auto-start bij boot:${NC}"
echo "  Installeer Termux:Boot uit F-Droid"
echo "  https://f-droid.org/en/packages/com.termux.boot/"
echo ""
echo -e "  ${YELLOW}Werven map:${NC} /sdcard/Werven"
echo "  (zichtbaar in Android Bestanden-app)"
echo ""
echo -e "  ${YELLOW}Tip:${NC} Installeer ook Tailscale uit Play Store"
echo "  voor veilige verbinding zonder port-forwarding."
echo ""
echo -e "  Typ ${GREEN}vm-start${NC} om nu te starten!"
echo ""
