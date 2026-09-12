# Daily Badge — VS Code extension

**A tiny spark of delight in your status bar, every day.** ✨

Open your editor to a fresh quirky message — an on-this-day fact, a dose of developer
humor, or a piece of tech trivia — refreshed every day in **your** timezone. Same content
as the [Daily Badge](https://github.com/in-c0/daily-badge) GitHub profile badge, so your
editor and your profile stay in sync.

![Daily Badge demo](https://raw.githubusercontent.com/in-c0/daily-badge/main/assets/daily-badge-demo.gif)

## Features

- A ✨ message in the status bar, updated automatically at your local midnight.
- Three packs: **default** (on-this-day fun), **dev-humor**, **tech-facts**.
- Click it to open the [customizer](https://in-c0.github.io/daily-badge/).
- Commands: **Daily Badge: Refresh**, **Cycle Pack**, **Open Customizer**.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `dailyBadge.pack` | `default` | `default` · `dev-humor` · `tech-facts` |
| `dailyBadge.timezone` | *(system)* | IANA tz, e.g. `Australia/Sydney`. Empty = your system tz. |
| `dailyBadge.endpoint` | Worker URL | Point at your own deployment if self-hosting. |
| `dailyBadge.alignment` | `right` | Status bar side. |
| `dailyBadge.maxLength` | `45` | Status-bar text cap (full text in the tooltip). |

## How it works

The extension fetches today's message from the Daily Badge Worker
(`/badge.json?tz=…&pack=…`) — the same source the profile badge uses. No tracking,
no account, one tiny request per day.

## Develop & run

```bash
cd vscode-extension
# Press F5 in VS Code to launch an Extension Development Host, or:
npx @vscode/vsce package        # builds daily-badge-x.y.z.vsix
code --install-extension daily-badge-*.vsix
```

## Publishing (maintainer)

1. Create a publisher at https://marketplace.visualstudio.com/manage and an Azure
   DevOps Personal Access Token (Marketplace → Manage scope).
2. Set `"publisher"` in `package.json` to your publisher id.
3. Add `icon.png` (128×128) if not present.
4. `npx @vscode/vsce login <publisher>` then `npx @vscode/vsce publish`.
