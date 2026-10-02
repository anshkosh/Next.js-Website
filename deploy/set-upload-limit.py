#!/usr/bin/env python3
"""Manual root-only change: allow 5 MB PDFs plus multipart overhead for Anshkosh.

Never called by the restricted automatic deployment key. Backs up the exact
Anshkosh config, validates Nginx, and restores it if validation or reload fails.
"""
import datetime
import os
import pathlib
import re
import shutil
import subprocess
import tempfile

CONFIG = pathlib.Path("/etc/nginx/conf.d/anshkosh.conf")
BACKUPS = pathlib.Path("/var/lib/anshkosh-routing")


def updated_config(original):
    names = re.findall(r"(?m)^\s*server_name\s+([^;]+);", original)
    allowed = {"anshkosh.com", "www.anshkosh.com"}
    if not names or any(set(name.split()) != allowed for name in names):
        raise ValueError("Expected only the two official Anshkosh server names")
    updated = re.sub(r"(?m)^[ \t]*client_max_body_size[ \t]+[^;\n]+;[ \t]*(?:\r?\n|$)", "", original)
    return re.sub(r"(?m)^(\s*server_name\s+[^;]+;)", r"\1\n    client_max_body_size 6m;", updated)


def replace_config(text, mode):
    fd, name = tempfile.mkstemp(prefix=".anshkosh-upload-", dir=str(CONFIG.parent))
    try:
        with os.fdopen(fd, "w") as output:
            output.write(text)
        os.chmod(name, mode)
        os.replace(name, str(CONFIG))
        subprocess.run(["/usr/sbin/restorecon", str(CONFIG)], check=True)
    finally:
        if os.path.exists(name):
            os.unlink(name)


def main():
    if os.geteuid() != 0 or CONFIG.is_symlink() or CONFIG.resolve() != CONFIG or not CONFIG.is_file():
        raise SystemExit("Run as root against the existing regular Anshkosh configuration")
    original = CONFIG.read_text()
    updated = updated_config(original)
    mode = CONFIG.stat().st_mode & 0o777
    BACKUPS.mkdir(mode=0o700, exist_ok=True)
    if BACKUPS.is_symlink() or BACKUPS.resolve() != BACKUPS:
        raise SystemExit("Unexpected backup path")
    backup = BACKUPS / ("nginx-upload-" + datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%S%f") + ".conf")
    shutil.copy2(str(CONFIG), str(backup))
    os.chmod(str(backup), 0o600)
    try:
        replace_config(updated, mode)
        subprocess.run(["/usr/sbin/nginx", "-t"], check=True)
        subprocess.run(["/usr/bin/systemctl", "reload", "nginx"], check=True)
    except Exception:
        replace_config(original, mode)
        subprocess.run(["/usr/sbin/nginx", "-t"], check=True)
        subprocess.run(["/usr/bin/systemctl", "reload", "nginx"], check=True)
        raise
    print("Anshkosh request limit is now 6 MB; application PDFs remain limited to 5 MB.")
    print("Previous configuration retained at " + str(backup))


if __name__ == "__main__":
    main()
