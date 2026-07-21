import datetime as dt

import generate_badge as gb


def test_every_day_of_leap_year_has_a_message():
    """Every calendar day (incl. Feb 29) must map to a message in the CSV."""
    df = gb.load_messages()
    present = set(df["Day"])

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
    df = gb.load_messages()
    dupes = df[df["Day"].duplicated()]["Day"].tolist()
    assert not dupes, f"Duplicate day entries: {dupes}"


def test_get_message_falls_back_when_missing():
    df = gb.load_messages()
    assert gb.get_message(df, "Smarch", 42) == gb.FALLBACK_MESSAGE


def test_build_badge_schema():
    badge = gb.build_badge("hello")
    assert badge["schemaVersion"] == 1
    assert badge["message"] == "hello"
    assert set(badge) == {"schemaVersion", "label", "message", "color"}
