#!/usr/bin/env python3
"""Validate the incoming source archive; compatible with the VPS's Python 3.6."""
import pathlib
import sys
import tarfile

MAX_BYTES = 250 * 1024 * 1024
with tarfile.open(sys.argv[1], "r:gz") as archive:
    total = 0
    for member in archive:
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or ".." in path.parts:
            raise SystemExit("Unsafe archive path")
        if not (member.isfile() or member.isdir()):
            raise SystemExit("Archive links and special files are not allowed")
        total += member.size
        if total > MAX_BYTES:
            raise SystemExit("Source archive is larger than the deployment limit")
print("Source archive validated")
