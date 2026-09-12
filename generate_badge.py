"""Fork path: write badge.json for today in your timezone.

Standard library only (csv + zoneinfo) so the daily GitHub Action installs
nothing and cannot break on a dependency. Run: python generate_badge.py
"""
import csv
import json
import os
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# ─── Config ────────────────────────────────────────────────────
DEFAULT_TZ = "UTC"
TIMEZONE_PATH = "timezone.txt"
CSV_PATH = "What_Day_365.csv"
BADGE_PATH = "badge.json"
FALLBACK_MESSAGE = "You're amazing!"


def load_timezone(path=TIMEZONE_PATH):
    """Read the user's timezone from timezone.txt, falling back to UTC."""
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return ZoneInfo(f.read().strip())
        except (ZoneInfoNotFoundError, ValueError, OSError):
            return ZoneInfo(DEFAULT_TZ)
    return ZoneInfo(DEFAULT_TZ)


def load_messages(path=CSV_PATH):
    """Load the day→message table as a dict keyed by 'Month Day'."""
    with open(path, newline="", encoding="utf-8") as f:
        return {row["Day"].strip(): row["Message"].strip() for row in csv.DictReader(f)}


def get_message(messages, month, day):
    """Return the message for a given month name + day, or a fallback."""
    return messages.get(f"{month} {day}", FALLBACK_MESSAGE)


def build_badge(message):
    """Build the Shields.io endpoint payload."""
    return {
        "schemaVersion": 1,
        "label": "Today is ... ",
        "message": message,
        "color": "pink",
    }


def main():
    tz = load_timezone()
    today = datetime.now(tz)
    messages = load_messages()
    message = get_message(messages, today.strftime("%B"), today.day)
    badge = build_badge(message)

    with open(BADGE_PATH, "w", encoding="utf-8") as f:
        json.dump(badge, f)

    print(f"[{today.strftime('%Y-%m-%d')}] Generated badge in timezone: {tz}")


if __name__ == "__main__":
    main()
