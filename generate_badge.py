import pandas as pd
from datetime import datetime
import json
import pytz
import os

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
                return pytz.timezone(f.read().strip())
        except Exception:
            return pytz.timezone(DEFAULT_TZ)
    return pytz.timezone(DEFAULT_TZ)


def load_messages(path=CSV_PATH):
    """Load the day→message table."""
    return pd.read_csv(path)


def get_message(df, month, day):
    """Return the message for a given month name + day, or a fallback."""
    matches = df[df["Day"] == f"{month} {day}"]["Message"].values
    if len(matches):
        return matches[0]
    return FALLBACK_MESSAGE


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
    df = load_messages()
    message = get_message(df, today.strftime("%B"), today.day)
    badge = build_badge(message)

    with open(BADGE_PATH, "w", encoding="utf-8") as f:
        json.dump(badge, f)

    print(f"[{today.strftime('%Y-%m-%d')}] Generated badge in timezone: {tz}")


if __name__ == "__main__":
    main()
