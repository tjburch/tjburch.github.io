"""Capture pre-game moneyline odds from the ESPN scoreboard API.

Fetches upcoming/scheduled NCAA tournament games, extracts DraftKings
moneyline odds, converts to de-vigged implied probabilities, and
appends to market_odds.json for Brier score benchmarking.

Requires: the snapshot JSON (latest.json) to exist so we can map
ESPN team IDs to bracket slots.
"""

import json
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "assets" / "data" / "march-madness-2026"

ESPN_SCOREBOARD = (
    "https://site.api.espn.com/apis/site/v2/sports/basketball/"
    "{sport}/scoreboard?dates={date}&groups=100&limit=100"
)

GENDERS = {
    "mens": "mens-college-basketball",
    "womens": "womens-college-basketball",
}

# Tournament date ranges (inclusive)
TOURNAMENT_DATES = {
    "mens": ("2026-03-17", "2026-04-06"),
    "womens": ("2026-03-19", "2026-04-06"),
}


def ml_to_prob(ml: int) -> float:
    """Convert American moneyline to raw implied probability."""
    if ml < 0:
        return abs(ml) / (abs(ml) + 100)
    return 100 / (ml + 100)


def devig(ml_a: int, ml_b: int) -> float:
    """Convert two American moneylines to de-vigged probability for side A."""
    raw_a = ml_to_prob(ml_a)
    raw_b = ml_to_prob(ml_b)
    return round(raw_a / (raw_a + raw_b), 4)


def build_slot_lookup(snapshot: dict) -> tuple:
    """Build lookup structures for mapping ESPN games to bracket slots.

    Returns:
        (espn_to_kaggle, r1_slots, contender_slots) where:
        - espn_to_kaggle: ESPN team ID -> Kaggle team ID
        - r1_slots: dict of espn_id -> (slot, side) for R1 team_a/team_b games
        - contender_slots: dict of slot -> set of kaggle_ids for R2+ contender games
    """
    bracket = snapshot.get("bracket", {})

    # Build espn_id -> kaggle_id from branding file
    espn_to_kaggle = {}
    branding_path = DATA_DIR / "team_branding.json"
    if branding_path.exists():
        with open(branding_path) as f:
            branding = json.load(f)
        for kaggle_id, info in branding.items():
            if info.get("espn_id"):
                espn_to_kaggle[info["espn_id"]] = int(kaggle_id)

    # Also build reverse for R1 lookup
    kaggle_to_espn = {v: k for k, v in espn_to_kaggle.items()}

    # R1 games with explicit team_a/team_b
    r1_slots = {}
    for slot, game in bracket.items():
        team_a = game.get("team_a")
        team_b = game.get("team_b")
        if not team_a or not team_b:
            continue
        for side, team in [("a", team_a), ("b", team_b)]:
            espn_id = kaggle_to_espn.get(team["id"])
            if espn_id:
                r1_slots[espn_id] = (slot, side)

    # R2+ games with contenders format
    contender_slots = {}
    for slot, game in bracket.items():
        contenders = game.get("contenders")
        if not contenders:
            continue
        contender_slots[slot] = {c["id"] for c in contenders}

    return espn_to_kaggle, r1_slots, contender_slots


def find_contender_slot(kaggle_a: int, kaggle_b: int, contender_slots: dict) -> str | None:
    """Find the bracket slot where both teams appear as contenders."""
    for slot, ids in contender_slots.items():
        if kaggle_a in ids and kaggle_b in ids:
            return slot
    return None


def fetch_day_odds(sport: str, date_str: str) -> list:
    """Fetch scheduled games with moneyline odds for a given date."""
    url = ESPN_SCOREBOARD.format(sport=sport, date=date_str)
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
    except Exception as e:
        print(f"  Warning: fetch failed for {date_str}: {e}")
        return []

    results = []
    for event in data.get("events", []):
        status = event.get("status", {}).get("type", {}).get("name", "")
        if status not in ("STATUS_SCHEDULED", "STATUS_HALFTIME", "STATUS_IN_PROGRESS"):
            continue

        comp = event["competitions"][0]
        odds_list = comp.get("odds", [])
        if not odds_list:
            continue

        odds = odds_list[0]
        ml = odds.get("moneyline", {})
        home_close = ml.get("home", {}).get("close", {}).get("odds")
        away_close = ml.get("away", {}).get("close", {}).get("odds")

        # Fall back to open odds if close not yet available
        if home_close is None:
            home_close = ml.get("home", {}).get("open", {}).get("odds")
        if away_close is None:
            away_close = ml.get("away", {}).get("open", {}).get("odds")

        if home_close is None or away_close is None:
            continue

        # Skip if odds are off the board
        try:
            home_close = int(home_close)
            away_close = int(away_close)
        except (ValueError, TypeError):
            continue

        competitors = comp["competitors"]
        if len(competitors) != 2:
            continue

        # ESPN: competitors[0] is usually home, competitors[1] is away
        home_id = int(competitors[0]["team"]["id"])
        away_id = int(competitors[1]["team"]["id"])

        results.append({
            "home_espn_id": home_id,
            "away_espn_id": away_id,
            "home_ml": home_close,
            "away_ml": away_close,
            "home_name": competitors[0]["team"].get("displayName", ""),
            "away_name": competitors[1]["team"].get("displayName", ""),
        })

    return results


def capture_gender(gender_key: str):
    """Capture odds for one gender's tournament."""
    gender_dir = DATA_DIR / gender_key
    snapshot_path = gender_dir / "latest.json"
    odds_path = gender_dir / "market_odds.json"

    if not snapshot_path.exists():
        print(f"  No snapshot found at {snapshot_path}, skipping")
        return

    with open(snapshot_path) as f:
        snapshot = json.load(f)

    # Load existing odds
    if odds_path.exists():
        with open(odds_path) as f:
            market_data = json.load(f)
    else:
        market_data = {"source": "DraftKings via ESPN", "games": {}}

    espn_to_kaggle, r1_slots, contender_slots = build_slot_lookup(snapshot)
    sport = GENDERS[gender_key]

    # Scan today and tomorrow
    today = datetime.now(timezone.utc).date()
    dates_to_scan = [today, today + timedelta(days=1)]

    start_str, end_str = TOURNAMENT_DATES[gender_key]
    start = datetime.strptime(start_str, "%Y-%m-%d").date()
    end = datetime.strptime(end_str, "%Y-%m-%d").date()

    new_count = 0
    for scan_date in dates_to_scan:
        if scan_date < start or scan_date > end:
            continue

        date_str = scan_date.strftime("%Y%m%d")
        print(f"  Scanning {gender_key} {scan_date}...")
        games = fetch_day_odds(sport, date_str)

        for game in games:
            slot = None
            a_is_home = None

            # Try R1 lookup first (explicit team_a/team_b slots)
            home_slot = r1_slots.get(game["home_espn_id"])
            away_slot = r1_slots.get(game["away_espn_id"])

            if home_slot and away_slot and home_slot[0] == away_slot[0]:
                slot = home_slot[0]
                a_is_home = home_slot[1] == "a"
            elif home_slot:
                slot = home_slot[0]
                a_is_home = home_slot[1] == "a"
            elif away_slot:
                slot = away_slot[0]
                a_is_home = away_slot[1] != "a"

            # Try R2+ contender lookup if R1 didn't match
            if slot is None:
                kaggle_home = espn_to_kaggle.get(game["home_espn_id"])
                kaggle_away = espn_to_kaggle.get(game["away_espn_id"])
                if kaggle_home and kaggle_away:
                    slot = find_contender_slot(kaggle_home, kaggle_away, contender_slots)
                    if slot:
                        # For contender slots, store probability for the
                        # higher-seeded team (home side of the ESPN listing
                        # is arbitrary for neutral-site tournament games).
                        # We store p for kaggle_home and note which is which.
                        a_is_home = True

            if slot is None:
                continue

            # Skip if we already have odds for this slot
            if slot in market_data["games"]:
                continue

            # Compute de-vigged probability
            if a_is_home:
                p_a = devig(game["home_ml"], game["away_ml"])
                raw_ml_a = str(game["home_ml"])
                raw_ml_b = str(game["away_ml"])
            else:
                p_a = devig(game["away_ml"], game["home_ml"])
                raw_ml_a = str(game["away_ml"])
                raw_ml_b = str(game["home_ml"])

            entry = {
                "p_a_wins": p_a,
                "raw_ml_a": raw_ml_a,
                "raw_ml_b": raw_ml_b,
            }

            # For contender slots (R2+), store Kaggle IDs so the dashboard
            # knows which team is "a" (no fixed team_a/team_b in those slots)
            if slot in contender_slots:
                kaggle_home = espn_to_kaggle.get(game["home_espn_id"])
                kaggle_away = espn_to_kaggle.get(game["away_espn_id"])
                if kaggle_home and kaggle_away:
                    if a_is_home:
                        entry["team_a_id"] = kaggle_home
                        entry["team_b_id"] = kaggle_away
                    else:
                        entry["team_a_id"] = kaggle_away
                        entry["team_b_id"] = kaggle_home

            market_data["games"][slot] = entry
            new_count += 1
            print(f"    {slot}: {game['away_name']} vs {game['home_name']} → p_a={p_a}")

    # Sort games by slot name for deterministic output
    market_data["games"] = dict(sorted(market_data["games"].items()))

    with open(odds_path, "w") as f:
        json.dump(market_data, f, separators=(",", ":"))

    print(f"  Wrote {odds_path} ({len(market_data['games'])} games, {new_count} new)")


def main():
    print("Capturing market odds from ESPN...")
    for gender_key in GENDERS:
        gender_dir = DATA_DIR / gender_key
        if gender_dir.exists():
            print(f"\n{gender_key}:")
            capture_gender(gender_key)

    print("\nDone.")


if __name__ == "__main__":
    main()
