import os
import sys
import json
import subprocess
import shutil
import webbrowser
import socket
from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.parse
from datetime import datetime
import threading

PORT = 16825  # Fixed port for local server
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                config = json.load(f)
                if "backup_dest" not in config:
                    config["backup_dest"] = ""
                if "monitored_folders" not in config:
                    config["monitored_folders"] = []
                if "sync_history" not in config:
                    config["sync_history"] = {}
                return config
        except:
            pass
    return {"backup_dest": "", "monitored_folders": [], "sync_history": {}}

def save_config(config):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Failed to save config: {e}")

def get_git_status(repo_path):
    is_git = os.path.isdir(os.path.join(repo_path, ".git"))
    has_changes = False
    file_count = 0
    
    if is_git:
        try:
            # Check for uncommitted changes
            res = subprocess.run(
                ["git", "status", "--porcelain"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            has_changes = len(res.stdout.strip()) > 0
            
            # Count tracked and untracked files (excluding ignored)
            res_files = subprocess.run(
                ["git", "ls-files", "-co", "--exclude-standard"],
                cwd=repo_path,
                capture_output=True,
                text=True,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            file_count = len(res_files.stdout.splitlines())
        except Exception as e:
            print(f"Git execution error for {repo_path}: {e}")
            
    return is_git, has_changes, file_count

def scan_repositories():
    config = load_config()
    repos = []
    
    for folder_path in config["monitored_folders"]:
        if not os.path.isdir(folder_path):
            continue
            
        try:
            # List first-level directories
            for entry in os.scandir(folder_path):
                if entry.is_dir():
                    path = entry.path
                    name = entry.name
                    # Skip system/hidden folders
                    if name.startswith(".") or name.startswith("$"):
                        continue
                        
                    is_git, has_changes, file_count = get_git_status(path)
                    
                    history = config["sync_history"].get(path, {})
                    last_time = history.get("time", "-")
                    last_status = history.get("status", "-")
                    
                    repos.append({
                        "name": name,
                        "path": path,
                        "parent_folder": folder_path,
                        "is_git": is_git,
                        "has_changes": has_changes,
                        "file_count": file_count,
                        "last_sync_time": last_time,
                        "last_sync_status": last_status
                    })
        except Exception as e:
            print(f"Failed to scan folder {folder_path}: {e}")
            
    return repos

def sync_repository(repo_path, backup_dest):
    is_git, _, _ = get_git_status(repo_path)
    if not is_git:
        return {"success": False, "error": "Not a Git repository"}
        
    if not backup_dest or not os.path.isdir(backup_dest):
        return {"success": False, "error": "Invalid backup destination"}
        
    project_name = os.path.basename(repo_path)
    target_path = os.path.join(backup_dest, project_name)
    
    try:
        # Get list of files to sync
        res = subprocess.run(
            ["git", "ls-files", "-co", "--exclude-standard"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        files = res.stdout.splitlines()
    except Exception as e:
        return {"success": False, "error": f"Git scan failed: {str(e)}"}
        
    copied = 0
    deleted = 0
    errors = []
    
    # 1. Sync / Copy files
    for file in files:
        src_file = os.path.join(repo_path, file)
        dest_file = os.path.join(target_path, file)
        dest_dir = os.path.dirname(dest_file)
        
        try:
            os.makedirs(dest_dir, exist_ok=True)
            if os.path.exists(src_file) and not os.path.isdir(src_file):
                # Copy if destination doesn't exist, or has different size/mtime
                if not os.path.exists(dest_file) or os.path.getmtime(src_file) > os.path.getmtime(dest_file) or os.path.getsize(src_file) != os.path.getsize(dest_file):
                    shutil.copy2(src_file, dest_file)
                    copied += 1
        except Exception as e:
            errors.append(f"{file}: {str(e)}")
            
    # 2. Clean up files deleted in source from backup
    if os.path.exists(target_path):
        expected_paths = {os.path.abspath(os.path.join(target_path, f)) for f in files}
        for root, dirs, filenames in os.walk(target_path):
            for filename in filenames:
                file_path = os.path.abspath(os.path.join(root, filename))
                if file_path not in expected_paths:
                    try:
                        os.remove(file_path)
                        deleted += 1
                    except Exception as e:
                        print(f"Failed to remove obsolete backup file {file_path}: {e}")
                        
        # Clean up empty subdirectories
        for root, dirs, filenames in os.walk(target_path, topdown=False):
            for d in dirs:
                dir_path = os.path.join(root, d)
                try:
                    if not os.listdir(dir_path):
                        os.rmdir(dir_path)
                except:
                    pass
                    
    # Update config sync history
    config = load_config()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_str = "Success" if not errors else "Failed"
    
    config["sync_history"][repo_path] = {
        "time": now_str,
        "status": status_str,
        "copied": copied,
        "deleted": deleted
    }
    save_config(config)
    
    if errors:
        return {
            "success": False, 
            "copied": copied, 
            "deleted": deleted, 
            "error": f"Partial success. Errors: {'; '.join(errors[:3])}"
        }
        
    return {"success": True, "copied": copied, "deleted": deleted, "time": now_str}

def ask_directory_dialog():
    try:
        # Run a separate python process to open the dialog to prevent thread deadlocks/hangs
        cmd = [
            sys.executable,
            "-c",
            "import tkinter as tk; from tkinter import filedialog; "
            "root = tk.Tk(); root.withdraw(); root.attributes('-topmost', True); "
            "root.focus_force(); path = filedialog.askdirectory(); "
            "print(path) if path else print('')"
        ]
        res = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        return res.stdout.strip()
    except Exception as e:
        print(f"Subprocess dialog error: {e}")
        return ""

class APIHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        
        if url.path == "/api/config":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(load_config()).encode('utf-8'))
            
        elif url.path == "/api/repos":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(scan_repositories()).encode('utf-8'))
            
        elif url.path == "/api/browse_folder":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            selected_path = ask_directory_dialog()
            self.wfile.write(json.dumps({"success": True, "path": selected_path}).encode('utf-8'))
            
        else:
            super().do_GET()

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            body = json.loads(post_data.decode('utf-8'))
        except:
            body = {}

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        
        response = {"success": False}
        
        if url.path == "/api/config":
            config = load_config()
            if "backup_dest" in body:
                config["backup_dest"] = body["backup_dest"]
            if "monitored_folders" in body:
                config["monitored_folders"] = body["monitored_folders"]
            save_config(config)
            response = {"success": True, "config": config}
            
        elif url.path == "/api/sync":
            repo_path = body.get("path")
            config = load_config()
            backup_dest = config["backup_dest"]
            
            if repo_path and backup_dest:
                res = sync_repository(repo_path, backup_dest)
                response = res
            else:
                response = {"success": False, "error": "Missing path or backup destination"}
                
        elif url.path == "/api/sync_all":
            config = load_config()
            backup_dest = config["backup_dest"]
            repos = scan_repositories()
            
            results = []
            for r in repos:
                if r["is_git"]:
                    res = sync_repository(r["path"], backup_dest)
                    results.append({"name": r["name"], "path": r["path"], "result": res})
                    
            response = {"success": True, "results": results}
            
        elif url.path == "/api/sync_active":
            config = load_config()
            backup_dest = config["backup_dest"]
            repos = scan_repositories()
            
            results = []
            for r in repos:
                # Only sync if it's a Git repo AND exists in config sync history
                if r["is_git"] and r["path"] in config["sync_history"]:
                    res = sync_repository(r["path"], backup_dest)
                    results.append({"name": r["name"], "path": r["path"], "result": res})
                    
            response = {"success": True, "results": results}
            
        self.wfile.write(json.dumps(response).encode('utf-8'))

def start_server():
    server_address = ('localhost', PORT)
    httpd = HTTPServer(server_address, APIHandler)
    print(f"Server started on http://localhost:{PORT}")
    
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Open browser in a separate thread
    threading.Timer(1.0, lambda: webbrowser.open(f"http://localhost:{PORT}")).start()
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
        sys.exit(0)

if __name__ == "__main__":
    start_server()
