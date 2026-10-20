"""Preview auth-query exposure without printing values; explicitly apply redaction.

Apply rotates/reopens nginx's active log, waits for writers to leave the old inode,
then preserves every record in a redacted archive and removes the raw temporary.
No log history is discarded. Do not apply without the owner's approval.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import stat
import time
import uuid

PARAM = re.compile(r'((?:[?&]|%3f|%26)(password|passwd|pwd|email|name)(?:=|%3d))([^&\s"<>]*)', re.I)
PASSWORD = re.compile(r'(?:[?&]|%3f|%26)(?:password|passwd|pwd)(?:=|%3d)([^&\s"<>]*)', re.I)
ACTIVE_LOG = Path("/var/log/nginx/access.log")


def redact_line(line):
    # Do not stop at %26: it may be an ampersand inside the encoded password.
    # Redacting the encoded query tail is preferable to retaining a secret suffix.
    exposed = any(match[1] not in ("", "REDACTED") for match in PASSWORD.finditer(line))
    if not exposed:
        return line, False
    return PARAM.sub(lambda match: match[1] + "REDACTED", line), True


def inspect_log(path):
    digest = hashlib.sha256()
    records = exposed = 0
    with path.open("rb") as source:
        for raw in source:
            digest.update(raw)
            records += 1
            exposed += redact_line(raw.decode("utf-8", errors="surrogateescape"))[1]
    return {"records": records, "exposed_records": exposed, "sha256": digest.hexdigest()}


def nginx_writes_inode(device, inode):
    for process in Path("/proc").iterdir():
        if not process.name.isdigit():
            continue
        try:
            if (process / "comm").read_text().strip() != "nginx":
                continue
            for fd in (process / "fd").iterdir():
                try:
                    info = fd.stat()
                    if info.st_dev == device and info.st_ino == inode:
                        return True
                except OSError:
                    pass
        except OSError:
            pass
    return False


def apply_redaction(path, expected_lines):
    if path != ACTIVE_LOG or path.is_symlink() or path.resolve() != ACTIVE_LOG or os.geteuid() != 0:
        raise RuntimeError("Apply requires root and the exact regular nginx access.log")
    import fcntl
    with Path("/var/log/nginx/.auth-redaction.lock").open("a") as lock:
        os.chmod(lock.name, 0o600)
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        before = inspect_log(path)
        if before["exposed_records"] != expected_lines or expected_lines < 1:
            raise RuntimeError("Exposure count changed; obtain a fresh preview")
        pid = int(Path("/run/nginx.pid").read_text().strip())
        if pid <= 1 or Path(f"/proc/{pid}/comm").read_text().strip() != "nginx":
            raise RuntimeError("Could not verify the nginx master PID")
        info = path.stat()
        if not stat.S_ISREG(info.st_mode):
            raise RuntimeError("Expected a regular access log")
        suffix = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime()) + "-" + uuid.uuid4().hex[:8]
        raw_path = path.with_name(".access-auth-redaction-source-" + suffix)
        archive_path = path.with_name("access-auth-redacted-" + suffix + ".log")
        os.rename(path, raw_path)
        os.chmod(raw_path, 0o600)
        descriptor = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, stat.S_IMODE(info.st_mode))
        os.fchown(descriptor, info.st_uid, info.st_gid)
        os.fchmod(descriptor, stat.S_IMODE(info.st_mode))
        os.close(descriptor)
        # USR1 reopens log files; it does not restart nginx or change routing.
        os.kill(pid, signal.SIGUSR1)
        deadline = time.monotonic() + 10
        while nginx_writes_inode(info.st_dev, info.st_ino):
            if time.monotonic() >= deadline:
                raise RuntimeError("Old log still has writers; private source retained for recovery")
            time.sleep(0.1)
        records = redacted = 0
        with raw_path.open("rb") as source, archive_path.open("xb") as target:
            os.chmod(archive_path, 0o600)
            for raw in source:
                clean, changed = redact_line(raw.decode("utf-8", errors="surrogateescape"))
                target.write(clean.encode("utf-8", errors="surrogateescape"))
                records += 1
                redacted += changed
            target.flush()
            os.fsync(target.fileno())
        after = inspect_log(archive_path)
        if after["records"] != records or after["exposed_records"] or redacted < expected_lines:
            raise RuntimeError("Archive verification failed; private source retained for recovery")
        os.chown(archive_path, info.st_uid, info.st_gid)
        os.chmod(archive_path, stat.S_IMODE(info.st_mode))
        raw_path.unlink()
        return {"mode": "applied", "records_preserved": records, "redacted_records": redacted, "archive": str(archive_path), "active_log": str(path)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--expected-lines", type=int)
    args = parser.parse_args()
    if args.apply:
        if args.expected_lines is None:
            parser.error("--apply requires --expected-lines from a fresh preview")
        result = apply_redaction(ACTIVE_LOG, args.expected_lines)
    else:
        result = {"mode": "preview", "path": str(ACTIVE_LOG), **inspect_log(ACTIVE_LOG)}
    print(json.dumps(result))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Never echo exceptions or log contents; they can include credentials.
        print(json.dumps({"error": "Redaction did not complete. Inspect protected files on the server; do not print their contents."}))
        raise SystemExit(1)
