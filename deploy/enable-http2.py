#!/usr/bin/env python3
"""Manual root-only HTTP/2 enablement for the existing AlmaLinux nginx config.

Not invoked by application deployment. Preserves routing, TLS policy and upload
limits, takes the deployment lock, and restores the backup on validation failure.
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
LOCK = pathlib.Path("/var/www/anshkosh-shared/state/deploy.lock")


def updated_config(original):
    names = re.findall(r"(?m)^\s*server_name\s+([^;]+);", original)
    allowed = {"anshkosh.com", "www.anshkosh.com"}
    if not names or any(not set(name.split()) <= allowed for name in names):
        raise ValueError("Expected only official Anshkosh server names")
    if len(re.findall(r"proxy_pass\s+http://(?:localhost|127\.0\.0\.1):(?:3000|3012);", original)) != 1:
        raise ValueError("Expected exactly one active Anshkosh proxy")
    if len(re.findall(r"alias\s+/var/www/[^;\n]+;", original)) != 1:
        raise ValueError("Expected exactly one static alias")
    tls_listeners = 0

    def listener(match):
        nonlocal tls_listeners
        options = match.group(2).split()
        if options[0] not in ("443", "[::]:443", "0.0.0.0:443") or "ssl" not in options:
            return match.group(0)
        tls_listeners += 1
        return match.group(0) if "http2" in options else match.group(1) + match.group(2) + " http2;"

    updated = re.sub(r"(?m)^([ \t]*listen[ \t]+)([^;\n]+);", listener, original)
    if not tls_listeners:
        raise ValueError("Expected existing HTTPS listeners")
    return updated


def replace_config(text, mode):
    fd, name = tempfile.mkstemp(prefix=".anshkosh-http2-", dir=str(CONFIG.parent))
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
    import fcntl  # Linux server only; config transformation tests also run on Windows.
    if os.geteuid() != 0 or CONFIG.is_symlink() or CONFIG.resolve() != CONFIG or not CONFIG.is_file():
        raise SystemExit("Run as root against the existing regular Anshkosh config")
    # AlmaLinux 8 ships Python 3.6; capture_output/text were added in 3.7.
    build = subprocess.run(["/usr/sbin/nginx", "-V"], stdout=subprocess.PIPE,
                           stderr=subprocess.PIPE, universal_newlines=True, check=True)
    if "--with-http_v2_module" not in build.stderr + build.stdout:
        raise SystemExit("Installed nginx lacks HTTP/2 support; no changes made")
    with LOCK.open("a+") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        original = CONFIG.read_text()
        updated = updated_config(original)
        if updated == original:
            print("HTTP/2 is already enabled in this config; verify public ALPN")
            return
        mode = CONFIG.stat().st_mode & 0o777
        BACKUPS.mkdir(mode=0o700, exist_ok=True)
        if BACKUPS.is_symlink() or BACKUPS.resolve() != BACKUPS:
            raise SystemExit("Unexpected backup path")
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%S%f")
        backup = BACKUPS / ("nginx-http2-" + stamp + ".conf")
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
        print("HTTP/2 enabled; verify public ALPN before reporting completion")
        print("Previous config retained at " + str(backup))


if __name__ == "__main__":
    main()
