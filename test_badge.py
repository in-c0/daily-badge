import csv
import datetime as dt

import generate_badge as gb


def test_every_day_of_leap_year_has_a_message():
    """Every calendar day (incl. Feb 29) must map to a message in the CSV."""
    present = gb.load_messages()

    missing = []
    year = 2024  # leap year → exercises Feb 29 too
    day = dt.date(year, 1, 1)
    while day.year == year:
        key = f"{day.strftime('%B')} {day.day}"
        if key not in present:
            missing.append(key)
        day += dt.timedelta(days=1)

    assert not missing, f"Days with no message: {missing}"


def test_no_duplicate_days():
    with open(gb.CSV_PATH, newline="", encoding="utf-8") as f:
        days = [row["Day"] for row in csv.DictReader(f)]
    dupes = sorted({d for d in days if days.count(d) > 1})
    assert not dupes, f"Duplicate day entries: {dupes}"


def test_get_message_falls_back_when_missing():
    messages = gb.load_messages()
    assert gb.get_message(messages, "Smarch", 42) == gb.FALLBACK_MESSAGE


def test_build_badge_schema():
    badge = gb.build_badge("hello")
    assert badge["schemaVersion"] == 1
    assert badge["message"] == "hello"
    assert set(badge) == {"schemaVersion", "label", "message", "color"}


def test_timezone_fallback(tmp_path):
    bad = tmp_path / "timezone.txt"
    bad.write_text("Mars/Olympus_Mons", encoding="utf-8")
    assert str(gb.load_timezone(bad)) == "UTC"
    good = tmp_path / "tz2.txt"
    good.write_text("Australia/Sydney\n", encoding="utf-8")
    assert str(gb.load_timezone(good)) == "Australia/Sydney"


def test_csv_and_worker_default_pack_agree():
    """The Worker's default pack is generated from the CSV; keep them in sync."""
    import json, re, pathlib
    js = pathlib.Path("worker/src/packs/default.js").read_text(encoding="utf-8")
    body = js[js.index("messages: {") + len("messages: ") : js.rindex("}") ]
    body = body[: body.rindex("}") + 1]
    pack = json.loads(body)
    assert pack == gb.load_messages()
