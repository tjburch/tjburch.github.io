"""Update pull request statuses in annual open source contribution posts."""

import json
import os
import re
import urllib.error
import urllib.request
from datetime import date, datetime
from pathlib import Path

POST_PATTERN = "_posts/*-open-source-contributions.md"
ENTRY_PATTERN = re.compile(
    r'  <li class="contribution-ledger__entry">.*?</li>', re.DOTALL
)
PR_PATTERN = re.compile(r'https://github\.com/([^/]+)/([^/]+)/pull/(\d+)')
EVENT_PATTERN = re.compile(
    r'<time datetime="[^"]+">[^<]+</time>\s*'
    r'<span class="contribution-status contribution-status--[^" ]+">[^<]+</span>'
)
LAST_MODIFIED_PATTERN = re.compile(r"^last_modified_at: .+$", re.MULTILINE)
SUMMARY_DATE_PATTERN = re.compile(
    r'Last updated <time datetime="[^"]+">[^<]+</time>'
)


def fetch_pull_request(owner, repository, number):
    request = urllib.request.Request(
        f"https://api.github.com/repos/{owner}/{repository}/pulls/{number}",
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "tjburch.github.io status updater",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        request.add_header("Authorization", f"Bearer {token}")

    try:
        with urllib.request.urlopen(request) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        message = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"GitHub API request failed for {owner}/{repository}#{number}: "
            f"{error.code} {message}"
        ) from error


def pull_request_event(pull_request):
    if pull_request["merged_at"]:
        status = "Merged"
        event_date = pull_request["merged_at"]
    elif pull_request["state"] == "open":
        status = "Open"
        event_date = pull_request["created_at"]
    else:
        status = "Closed"
        event_date = pull_request["closed_at"] or pull_request["created_at"]

    parsed_date = datetime.fromisoformat(event_date.replace("Z", "+00:00")).date()
    return status, parsed_date


def update_entry(entry):
    match = PR_PATTERN.search(entry)
    if not match:
        raise ValueError("Contribution entry does not contain a GitHub pull request URL")

    pull_request = fetch_pull_request(*match.groups())
    status, event_date = pull_request_event(pull_request)
    event = (
        f'<time datetime="{event_date.isoformat()}">'
        f"{event_date:%b} {event_date.day}</time>\n"
        f'      <span class="contribution-status '
        f'contribution-status--{status.lower()}">{status}</span>'
    )
    updated_entry, count = EVENT_PATTERN.subn(event, entry, count=1)
    if count != 1:
        raise ValueError(f"Could not update contribution entry for {match.group(0)}")
    return updated_entry, event_date


def update_post(path):
    content = path.read_text()
    entries = ENTRY_PATTERN.findall(content)
    if not entries:
        return False

    updated_entries = [update_entry(entry) for entry in entries]
    updated_entries.sort(key=lambda item: item[1])

    entry_iterator = iter(entry for entry, _ in updated_entries)
    updated_content = ENTRY_PATTERN.sub(lambda _: next(entry_iterator), content)
    if updated_content == content:
        return False

    today = date.today()
    updated_content = LAST_MODIFIED_PATTERN.sub(
        f"last_modified_at: {today.isoformat()}", updated_content, count=1
    )
    summary_date = (
        f'Last updated <time datetime="{today.isoformat()}">'
        f"{today:%B} {today.day}, {today.year}</time>"
    )
    updated_content = SUMMARY_DATE_PATTERN.sub(summary_date, updated_content, count=1)
    path.write_text(updated_content)
    return True


def main():
    paths = sorted(Path().glob(POST_PATTERN))
    if not paths:
        raise SystemExit(f"No posts matched {POST_PATTERN}")

    changed = [path for path in paths if update_post(path)]
    if changed:
        print("Updated " + ", ".join(str(path) for path in changed))
    else:
        print("Pull request statuses are current")


if __name__ == "__main__":
    main()
