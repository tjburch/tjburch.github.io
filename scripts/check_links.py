"""Check external links in blog posts for rot.

Extracts every http(s) URL from _posts/*.md (markdown links/images, <a href>,
<script src>, <source srcset>), then requests each unique URL once and reports
which are dead. Exits non-zero if any dead links are found so it can gate CI.

Run from the repo root: `python scripts/check_links.py`.
"""

import concurrent.futures
import re
import sys
import urllib.error
import urllib.request
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
POSTS = REPO / "_posts"

TIMEOUT = 15
MAX_WORKERS = 8
USER_AGENT = "Mozilla/5.0 (link-checker; +https://tjburch.github.io)"

URL_RE = re.compile(r'https?://[^\s)"\'<>\]]+')


def collect_urls():
    """Map each unique URL to the set of posts that reference it."""
    refs = defaultdict(set)
    for post in sorted(POSTS.glob("*.md")):
        text = post.read_text(encoding="utf-8")
        for match in URL_RE.finditer(text):
            url = match.group().rstrip(".,;")
            refs[url].add(post.name)
    return refs


def check(url):
    """Return (url, status) where status is an int code or an error string."""
    request = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as resp:
            return url, resp.status
    except urllib.error.HTTPError as exc:
        if exc.code in (403, 405, 501):
            return check_get(url)
        return url, exc.code
    except Exception:
        return check_get(url)


def check_get(url):
    request = urllib.request.Request(url, method="GET", headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as resp:
            return url, resp.status
    except urllib.error.HTTPError as exc:
        return url, exc.code
    except urllib.error.URLError as exc:
        return url, f"URLError: {exc.reason}"
    except Exception as exc:
        return url, f"{type(exc).__name__}: {exc}"


def is_dead(status):
    return not (isinstance(status, int) and status < 400)


def main():
    refs = collect_urls()
    print(f"Checking {len(refs)} unique URLs across {len(list(POSTS.glob('*.md')))} posts...\n")

    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
        for url, status in pool.map(check, refs):
            results[url] = status

    dead = {url: status for url, status in results.items() if is_dead(status)}

    if not dead:
        print(f"All {len(results)} links OK.")
        return 0

    print(f"{len(dead)} dead link(s):\n")
    for url in sorted(dead):
        posts = ", ".join(sorted(refs[url]))
        print(f"  [{dead[url]}] {url}")
        print(f"      in: {posts}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
