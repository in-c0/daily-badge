# 🌟 Daily Fun Message Badge

[![Tests](https://github.com/in-c0/daily-badge/actions/workflows/tests.yml/badge.svg)](https://github.com/in-c0/daily-badge/actions/workflows/tests.yml)
[![Daily Update](https://github.com/in-c0/daily-badge/actions/workflows/daily-badge.yml/badge.svg)](https://github.com/in-c0/daily-badge/actions/workflows/daily-badge.yml)

Get a cute, quirky, uplifting message on your GitHub profile — refreshed daily ✨

![Daily Badge](https://img.shields.io/endpoint?url=https://in-c0.github.io/daily-badge/badge.json&style=for-the-badge)

## 💖 Add to your Github profile!

Just add this to your `README.md`:

```markdown
![Daily Badge](https://img.shields.io/endpoint?url=https://in-c0.github.io/daily-badge/badge.json&style=for-the-badge)
```

To display this badge on your GitHub profile, add it to the `README.md` of the profile repo, i.e. a repo named exactly after your username.

> **Two URLs, both work.** The `badge.json` is available via GitHub Pages
> (`https://in-c0.github.io/daily-badge/badge.json`, used above) *and* directly from raw
> (`https://raw.githubusercontent.com/in-c0/daily-badge/main/badge.json`). Either is a valid
> Shields.io `endpoint`. Shields caches the rendered badge for a few minutes, so a fresh
> daily message can take a moment to appear — a hard refresh clears it.
 
### 🕒 Optional: Customize timezone

To change when your daily message updates, modify `timezone.txt` with a timezone from [this list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones), e.g. `Australia/Sydney`



---

## 🔄 How It Works

1. GitHub Actions runs once daily (midnight UTC)

2. It updates badge.json based on the current date

3. The badge is served through GitHub Pages

Powered by Shields.io and GitHub Actions
Made with ❤️ by in-c0
