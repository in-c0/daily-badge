const vscode = require("vscode");
const https = require("https");

const PACKS = ["default", "dev-humor", "tech-facts"];
let item;
let timer;

function cfg() {
  return vscode.workspace.getConfiguration("dailyBadge");
}

function resolveTz() {
  const tz = cfg().get("timezone");
  if (tz && tz.trim()) return tz.trim();
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// Dependency-free JSON GET (works on every VS Code / Node version).
function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { accept: "application/json" } }, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          res.resume();
          return reject(new Error("HTTP " + res.statusCode));
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

async function fetchMessage() {
  const endpoint = String(cfg().get("endpoint") || "").replace(/\/+$/, "");
  const pack = cfg().get("pack") || "default";
  const tz = resolveTz();
  const url = `${endpoint}/badge.json?tz=${encodeURIComponent(tz)}&pack=${encodeURIComponent(pack)}`;
  const data = await getJson(url);
  return { message: String(data.message || ""), pack };
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

async function refresh() {
  if (!item) return;
  try {
    const { message, pack } = await fetchMessage();
    const max = Number(cfg().get("maxLength")) || 45;
    item.text = `$(sparkle) ${truncate(message, max)}`;
    const tip = new vscode.MarkdownString(
      `**Daily Badge** · pack: \`${pack}\`\n\n${message}\n\n_Click to open the customizer_`
    );
    tip.isTrusted = false;
    item.tooltip = tip;
    item.show();
  } catch {
    if (!item.text) {
      item.text = "$(sparkle) Daily Badge";
      item.tooltip = "Daily Badge — couldn't reach the server. Will retry.";
      item.show();
    }
  }
}

function msUntilNextLocalMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 5, 0); // 00:00:05 local, next day
  return Math.max(60 * 1000, next.getTime() - now.getTime());
}

function scheduleDaily(context) {
  if (timer) clearTimeout(timer);
  const tick = async () => {
    await refresh();
    timer = setTimeout(tick, 24 * 60 * 60 * 1000);
  };
  timer = setTimeout(tick, msUntilNextLocalMidnight());
  context.subscriptions.push({ dispose: () => timer && clearTimeout(timer) });
}

function createItem() {
  if (item) item.dispose();
  const align =
    cfg().get("alignment") === "left"
      ? vscode.StatusBarAlignment.Left
      : vscode.StatusBarAlignment.Right;
  item = vscode.window.createStatusBarItem(align, 100);
  item.command = "dailyBadge.openCustomizer";
  item.name = "Daily Badge";
}

function activate(context) {
  createItem();
  context.subscriptions.push(item);

  context.subscriptions.push(
    vscode.commands.registerCommand("dailyBadge.refresh", refresh),
    vscode.commands.registerCommand("dailyBadge.openCustomizer", () =>
      vscode.env.openExternal(vscode.Uri.parse("https://in-c0.github.io/daily-badge/"))
    ),
    vscode.commands.registerCommand("dailyBadge.cyclePack", async () => {
      const cur = cfg().get("pack") || "default";
      const next = PACKS[(PACKS.indexOf(cur) + 1) % PACKS.length];
      await cfg().update("pack", next, vscode.ConfigurationTarget.Global);
      vscode.window.setStatusBarMessage(`Daily Badge pack: ${next}`, 2000);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration("dailyBadge")) return;
      if (e.affectsConfiguration("dailyBadge.alignment")) {
        createItem();
        context.subscriptions.push(item);
      }
      refresh();
    })
  );

  refresh();
  scheduleDaily(context);
}

function deactivate() {
  if (timer) clearTimeout(timer);
  if (item) item.dispose();
}

module.exports = { activate, deactivate };
