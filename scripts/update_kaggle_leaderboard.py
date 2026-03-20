"""Fetch Kaggle leaderboard ranking and append to kaggle_leaderboard.json."""

import json
import os
import subprocess
import tempfile
import zipfile
from datetime import date, timezone, datetime
from pathlib import Path

COMPETITION = "march-machine-learning-mania-2026"
USERNAME = "burcht11"
OUTPUT = Path("assets/data/march-madness-2026/kaggle_leaderboard.json")


def fetch_leaderboard():
    with tempfile.TemporaryDirectory() as tmpdir:
        subprocess.run(
            [
                "kaggle", "competitions", "leaderboard",
                COMPETITION, "--download", "--csv", "-p", tmpdir,
            ],
            check=True,
        )
        zippath = Path(tmpdir) / f"{COMPETITION}.zip"
        with zipfile.ZipFile(zippath) as zf:
            csv_name = [n for n in zf.namelist() if n.endswith(".csv")][0]
            content = zf.read(csv_name).decode("utf-8-sig")

    rows = content.strip().split("\n")
    total = len(rows) - 1  # exclude header

    for row in rows[1:]:
        parts = row.split(",")
        # Rank,TeamId,TeamName,LastSubmissionDate,Score,SubmissionCount,TeamMemberUserNames
        if parts[-1].strip() == USERNAME:
            return {
                "rank": int(parts[0]),
                "total_entries": total,
                "score": float(parts[4]),
            }

    return None


def main():
    entry = fetch_leaderboard()
    if not entry:
        print(f"User '{USERNAME}' not found on leaderboard")
        return

    today = date.today().isoformat()
    entry["date"] = today

    if OUTPUT.exists():
        data = json.loads(OUTPUT.read_text())
    else:
        data = []

    # Replace existing entry for today, or append
    data = [e for e in data if e.get("date") != today]
    data.append(entry)
    data.sort(key=lambda e: e["date"])

    OUTPUT.write_text(json.dumps(data, indent=2) + "\n")
    print(f"Updated: Rank {entry['rank']} / {entry['total_entries']}, Brier: {entry['score']}")


if __name__ == "__main__":
    main()
