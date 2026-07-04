"""Optimize site images: resize oversized rasters and generate WebP siblings.

Two operations:
  - resize: downscale a PNG/JPG in place so its longest side is <= MAX_DIM.
  - webp: write a WebP sibling alongside the (resized) original for <picture> use.

Idempotent: files already at or below the target dimension are left as-is, and
WebP siblings are only regenerated when missing or older than the source.

GitHub Pages runs no image build step, so this is a manual pre-commit pass.
Run from the repo root: `python scripts/optimize_images.py`.
"""

import subprocess
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent

MAX_DIM = 1600
AVATAR_MAX_DIM = 400
WEBP_QUALITY = 80
RESIZE_THRESHOLD_BYTES = 500 * 1024

# Photos converted to WebP with a resized PNG/JPG fallback (referenced via <picture>).
WEBP_TARGETS = [
    "blogimages/bread/asiago_parm.png",
    "blogimages/bread/bagels.png",
    "blogimages/bread/pretzels.png",
    "blogimages/bread/overnight_blonde.png",
    "blogimages/bread/cranberry_walnut.png",
    "images/bosox.png",
]

# Avatar/OG image displayed tiny site-wide; resize harder than content images.
AVATAR_TARGETS = ["images/bosox.png"]

# Orphaned files (no reference anywhere) to delete.
ORPHANS = ["images/sox_win.png"]


def dimensions(path):
    with Image.open(path) as img:
        return img.size


def resize_in_place(path, max_dim):
    """Downscale so the longest side is <= max_dim. Returns True if changed."""
    with Image.open(path) as img:
        w, h = img.size
        if max(w, h) <= max_dim:
            return False
        scale = max_dim / max(w, h)
        new_size = (round(w * scale), round(h * scale))
        resized = img.resize(new_size, Image.LANCZOS)
        params = {}
        if path.suffix.lower() in (".jpg", ".jpeg"):
            params = {"quality": 85, "optimize": True}
        elif path.suffix.lower() == ".png":
            params = {"optimize": True}
        resized.save(path, **params)
    return True


def make_webp(src):
    """Write src.webp next to src via cwebp. Returns the webp Path."""
    webp = src.with_suffix(".webp")
    if webp.exists() and webp.stat().st_mtime >= src.stat().st_mtime:
        return webp
    subprocess.run(
        ["cwebp", "-quiet", "-q", str(WEBP_QUALITY), "-resize", str(MAX_DIM), "0",
         str(src), "-o", str(webp)],
        check=True,
    )
    return webp


def human(num_bytes):
    for unit in ("B", "KB", "MB"):
        if num_bytes < 1024:
            return f"{num_bytes:.0f}{unit}"
        num_bytes /= 1024
    return f"{num_bytes:.1f}GB"


def main():
    before = 0
    after = 0

    for rel in ORPHANS:
        path = REPO / rel
        if path.exists():
            size = path.stat().st_size
            path.unlink()
            print(f"deleted orphan {rel} ({human(size)})")

    for rel in WEBP_TARGETS:
        path = REPO / rel
        if not path.exists():
            print(f"skip (missing): {rel}")
            continue
        start = path.stat().st_size
        before += start
        resize_in_place(path, MAX_DIM)
        webp = make_webp(path)
        after += path.stat().st_size + webp.stat().st_size
        print(f"webp {rel}: {human(start)} -> png {human(path.stat().st_size)} "
              f"+ webp {human(webp.stat().st_size)}")

    for rel in AVATAR_TARGETS:
        path = REPO / rel
        if path.exists():
            resize_in_place(path, AVATAR_MAX_DIM)
            make_webp(path)
            print(f"avatar {rel}: resized to {dimensions(path)}")

    webp_srcs = {REPO / rel for rel in WEBP_TARGETS} | {REPO / rel for rel in AVATAR_TARGETS}
    for path in sorted((REPO / "blogimages").rglob("*")):
        if path.suffix.lower() not in (".png", ".jpg", ".jpeg"):
            continue
        if path in webp_srcs:
            continue
        if path.stat().st_size < RESIZE_THRESHOLD_BYTES:
            continue
        start = path.stat().st_size
        before += start
        changed = resize_in_place(path, MAX_DIM)
        after += path.stat().st_size
        if changed:
            print(f"resize {path.relative_to(REPO)}: {human(start)} -> {human(path.stat().st_size)}")

    print(f"\ntotal (tracked targets): {human(before)} -> {human(after)}")


if __name__ == "__main__":
    sys.exit(main())
