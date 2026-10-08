"""Pack the cleaned fox art, then build and verify it with the page-mascot skill.

The image editor's rows have unequal spacing. These cuts sit in the empty gutters
so complete feet and tails survive; a uniform grid would slice them off.
"""
from pathlib import Path
import os
import re
import subprocess
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "characters" / "anshkosh-fox"
SKILL = Path.home() / ".codex" / "skills" / "page-mascot" / "scripts"
TILE = 528
GUTTERS = {
    "directions": ((0, 1 / 3, 2 / 3, 1), (0, 1 / 3, 2 / 3, 1)),
    "reactions": ((0, .344, .68, 1), (0, .359, .675, 1)),
}

for kind, (columns, rows) in GUTTERS.items():
    image = Image.open(SOURCE / f"{kind}-source.png").convert("RGBA")
    xs = [round(x * image.width) for x in columns]
    ys = [round(y * image.height) for y in rows]
    sheet = Image.new("RGBA", (TILE * 3, TILE * 3))
    for row in range(3):
        for column in range(3):
            frame = image.crop((xs[column], ys[row], xs[column + 1], ys[row + 1]))
            # Keep one source scale across all cells. Only add transparent space.
            sheet.alpha_composite(frame, (column * TILE + (TILE - frame.width) // 2,
                                          row * TILE + (TILE - frame.height) // 2))
    sheet.save(SOURCE / f"{kind}.png")

for arguments in (
    ("screen.py", str(SOURCE / "directions.png"), str(SOURCE / "reactions.png")),
    ("build.py", "anshkosh-fox", "--anchor", "shoulders", "--no-vignette"),
    ("verify.py", "anshkosh-fox"),
):
    result = subprocess.run([sys.executable, str(SKILL / arguments[0]), *arguments[1:]],
                            cwd=ROOT, check=True, capture_output=True, text=True,
                            # Feet are already normalized by the shoulder anchor.
                            # Allow only a small extra correction: the bust fitter
                            # otherwise shrinks the reactions to match paw shapes.
                            env={**os.environ, "MATCH_CLAMP": "0.02"})
    print(result.stdout)
    if arguments[0] == "verify.py":
        checks = ((r"moves ([\d.]+) rendered px", 2.0, "jump"),
                  (r"worst width change: \S+ at ([\d.]+)%", 12.0, "width"))
        for pattern, limit, label in checks:
            match = re.search(pattern, result.stdout)
            if not match or float(match[1]) > limit:
                sys.exit(f"Fox failed the {label} check; redraw and rebuild the source sheets.")
        palette = re.search(r"weakest palette match: \S+ at ([\d.]+)%", result.stdout)
        if not palette or float(palette[1]) < 22.0:
            sys.exit("Fox failed the palette check; redraw and rebuild the source sheets.")
