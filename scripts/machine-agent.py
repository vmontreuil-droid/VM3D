"""
VM Plan & Consult — Machine File Agent
=======================================
Draait op de machine-PC naast websockify.
Biedt een REST API voor bestandsbeheer vanuit het platform.

Installatie:
  pip install flask flask-cors

Starten:
  python machine-agent.py

Standaard poort: 6081
Standaard root:  D:\\Werven (aanpasbaar via --root)

Gebruik:
  python machine-agent.py --port 6081 --root "D:\\Werven"
"""

import os
import sys
import json
import argparse
import hashlib
import mimetypes
from datetime import datetime
from pathlib import Path, PurePosixPath

from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Will be set by argparse
ROOT_DIR = None
API_KEY = None


def safe_path(rel_path: str) -> Path:
    """Resolve a relative path safely within ROOT_DIR. Prevents path traversal."""
    # Normalize and resolve
    clean = PurePosixPath(rel_path.replace("\\", "/"))
    # Remove any leading slashes
    parts = [p for p in clean.parts if p not in ("/", "\\", "..")]
    resolved = ROOT_DIR.joinpath(*parts).resolve()
    # Ensure it's within ROOT_DIR
    if not str(resolved).startswith(str(ROOT_DIR)):
        abort(403, "Toegang geweigerd: pad buiten root directory")
    return resolved


def check_api_key():
    """Check API key if configured."""
    if not API_KEY:
        return
    key = request.headers.get("X-API-Key", "")
    if key != API_KEY:
        abort(401, "Ongeldige API-sleutel")


def file_info(path: Path, rel_to: Path) -> dict:
    """Get file/folder metadata."""
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
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "root": str(ROOT_DIR),
        "hostname": os.environ.get("COMPUTERNAME", "unknown"),
    })


@app.route("/files", methods=["GET"])
def list_files():
    """List files in a directory.
    
    Query params:
      path - relative path within root (default: "")
    """
    rel_path = request.args.get("path", "")
    target = safe_path(rel_path) if rel_path else ROOT_DIR

    if not target.exists():
        abort(404, f"Map niet gevonden: {rel_path}")
    if not target.is_dir():
        abort(400, f"Geen map: {rel_path}")

    items = []
    try:
        for entry in sorted(target.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
            # Skip hidden and system files
            if entry.name.startswith(".") or entry.name.startswith("$"):
                continue
            try:
                items.append(file_info(entry, ROOT_DIR))
            except (PermissionError, OSError):
                continue
    except PermissionError:
        abort(403, "Geen toegang tot deze map")

    return jsonify({
        "path": rel_path or "/",
        "items": items,
        "count": len(items),
    })


@app.route("/files/tree", methods=["GET"])
def file_tree():
    """Get a recursive directory tree (max 3 levels deep).
    
    Query params:
      path  - relative path within root (default: "")
      depth - max depth (default: 3, max: 5)
    """
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

    return jsonify({
        "path": rel_path or "/",
        "tree": build_tree(target, max_depth),
    })


@app.route("/files/upload", methods=["POST"])
def upload_file():
    """Upload a file to a specific directory.
    
    Form data:
      file - the file to upload
      path - target directory (relative to root)
    """
    if "file" not in request.files:
        abort(400, "Geen bestand meegegeven")

    file = request.files["file"]
    if not file.filename:
        abort(400, "Geen bestandsnaam")

    target_dir = request.form.get("path", "")
    dir_path = safe_path(target_dir) if target_dir else ROOT_DIR

    # Create directory if it doesn't exist
    dir_path.mkdir(parents=True, exist_ok=True)

    # Sanitize filename
    safe_name = Path(file.filename).name  # strips directory components
    target_file = dir_path / safe_name

    # Don't overwrite without explicit flag
    if target_file.exists() and not request.form.get("overwrite"):
        abort(409, f"Bestand bestaat al: {safe_name}")

    file.save(str(target_file))

    return jsonify({
        "status": "ok",
        "file": file_info(target_file, ROOT_DIR),
        "message": f"Bestand '{safe_name}' geüpload",
    })


@app.route("/files/upload-multiple", methods=["POST"])
def upload_multiple():
    """Upload multiple files to a specific directory.
    
    Form data:
      files - multiple files
      path  - target directory
    """
    files = request.files.getlist("files")
    if not files:
        abort(400, "Geen bestanden meegegeven")

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

    return jsonify({
        "status": "ok",
        "files": results,
        "count": len(results),
        "message": f"{len(results)} bestanden geüpload",
    })


@app.route("/files/mkdir", methods=["POST"])
def create_directory():
    """Create a new directory.
    
    JSON body:
      path - relative path of new directory
    """
    data = request.get_json()
    if not data or not data.get("path"):
        abort(400, "Pad is vereist")

    dir_path = safe_path(data["path"])
    dir_path.mkdir(parents=True, exist_ok=True)

    return jsonify({
        "status": "ok",
        "path": str(dir_path.relative_to(ROOT_DIR)).replace("\\", "/"),
        "message": "Map aangemaakt",
    })


@app.route("/files/download", methods=["GET"])
def download_file():
    """Download a file.
    
    Query params:
      path - relative path to file
    """
    rel_path = request.args.get("path", "")
    if not rel_path:
        abort(400, "Pad is vereist")

    file_path = safe_path(rel_path)
    if not file_path.exists() or not file_path.is_file():
        abort(404, "Bestand niet gevonden")

    return send_file(
        str(file_path),
        as_attachment=True,
        download_name=file_path.name,
    )


@app.route("/files/delete", methods=["DELETE"])
def delete_file():
    """Delete a file (not directories for safety).
    
    JSON body:
      path - relative path to file
    """
    data = request.get_json()
    if not data or not data.get("path"):
        abort(400, "Pad is vereist")

    file_path = safe_path(data["path"])
    if not file_path.exists():
        abort(404, "Bestand niet gevonden")
    if file_path.is_dir():
        abort(400, "Kan geen mappen verwijderen via API")

    file_path.unlink()
    return jsonify({"status": "ok", "message": f"Bestand verwijderd"})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VM Machine File Agent")
    parser.add_argument("--port", type=int, default=6081, help="Poort (standaard: 6081)")
    parser.add_argument("--root", type=str, default="D:\\Werven", help="Root directory (standaard: D:\\Werven)")
    parser.add_argument("--api-key", type=str, default=None, help="Optionele API-sleutel voor beveiliging")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Bind adres (standaard: 0.0.0.0)")
    args = parser.parse_args()

    ROOT_DIR = Path(args.root).resolve()
    API_KEY = args.api_key

    if not ROOT_DIR.exists():
        print(f"Root directory aanmaken: {ROOT_DIR}")
        ROOT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"")
    print(f"  VM Machine File Agent")
    print(f"  =====================")
    print(f"  Root:    {ROOT_DIR}")
    print(f"  Poort:   {args.port}")
    print(f"  API Key: {'Ja' if API_KEY else 'Nee (open)'}")
    print(f"")
    print(f"  Endpoints:")
    print(f"    GET    /health              - Status check")
    print(f"    GET    /files?path=...      - Bestanden lijst")
    print(f"    GET    /files/tree          - Directory tree")
    print(f"    POST   /files/upload        - Bestand uploaden")
    print(f"    POST   /files/upload-multiple - Meerdere bestanden")
    print(f"    POST   /files/mkdir         - Map aanmaken")
    print(f"    GET    /files/download      - Bestand downloaden")
    print(f"    DELETE /files/delete         - Bestand verwijderen")
    print(f"")

    app.run(host=args.host, port=args.port, debug=False)
