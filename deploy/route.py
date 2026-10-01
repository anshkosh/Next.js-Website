#!/usr/bin/env python3
"""Root-owned helper: only switch Anshkosh's proxy between two loopback ports."""
import datetime
import os
import pathlib
import re
import subprocess
import sys
import tempfile

CONFIG = pathlib.Path("/etc/nginx/conf.d/anshkosh.conf")
STATIC = pathlib.Path("/var/www/anshkosh-shared/static")
BACKUPS = pathlib.Path("/var/lib/anshkosh-routing")

def replace_config(text):
    fd, temporary = tempfile.mkstemp(prefix=".anshkosh-", dir=str(CONFIG.parent))
    try:
        with os.fdopen(fd, "w") as output:
            output.write(text)
        os.chmod(temporary, 0o644)
        os.replace(temporary, str(CONFIG))
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)

def main():
    if os.geteuid() != 0 or len(sys.argv) != 2 or sys.argv[1] not in ("3000", "3012"):
        raise SystemExit("Only root may select port 3000 or 3012")
    if CONFIG.is_symlink() or STATIC.resolve() != STATIC or not STATIC.is_dir():
        raise SystemExit("Unexpected routing/static path")
    original = CONFIG.read_text()
    updated, proxies = re.subn(
        r"proxy_pass\s+http://(?:localhost|127\.0\.0\.1):(?:3000|3012);",
        "proxy_pass http://127.0.0.1:" + sys.argv[1] + ";", original)
    updated, aliases = re.subn(r"alias\s+/var/www/[^;\n]+;",
                              "alias " + str(STATIC) + "/;", updated)
    if proxies != 1 or aliases != 1:
        raise SystemExit("Expected exactly one Anshkosh proxy and static alias")
    BACKUPS.mkdir(mode=0o700, exist_ok=True)
    stamp = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%S%f")
    backup = BACKUPS / ("nginx-" + stamp + ".conf")
    backup.write_text(original)
    os.chmod(str(backup), 0o600)
    try:
        replace_config(updated)
        subprocess.check_call(["/usr/sbin/nginx", "-t"])
        subprocess.check_call(["/usr/bin/systemctl", "reload", "nginx"])
    except Exception:
        replace_config(original)
        subprocess.check_call(["/usr/sbin/nginx", "-t"])
        subprocess.check_call(["/usr/bin/systemctl", "reload", "nginx"])
        raise
    print("Anshkosh now routes to loopback port " + sys.argv[1])

if __name__ == "__main__":
    main()
