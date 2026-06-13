import { writeFile } from "node:fs/promises";

const SOURCE_URL =
  "https://proclub.me/competitions/fpl/team/104-fifa-proclub-league-leaguecup-season-9/23228-all-attack";
const TEAM = "ALL ATTACK";
const OUTPUT = new URL("../data/proclub-schedule.json", import.meta.url);

function textFromHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDate(dateText) {
  return dateText.replaceAll(".", "-");
}

function parseMatches(text) {
  const start = text.indexOf("未来比赛");
  const end = text.indexOf("球员名册", start);
  const section = text.slice(start, end > start ? end : undefined);
  const rowPattern =
    /(\d{4}\.\d{2}\.\d{2})\s+(\d{2}:\d{2})\s+(.+?)\s+(主场|客场)\s+赛前分析/g;
  const rows = [];

  for (const match of section.matchAll(rowPattern)) {
    const [, dateText, time, opponent, venue] = match;
    const isHome = venue === "主场";
    rows.push({
      date: normalizeDate(dateText),
      time,
      home: isHome ? TEAM : opponent.trim(),
      away: isHome ? opponent.trim() : TEAM,
      venue,
      status: "即将",
    });
  }

  return rows;
}

const response = await fetch(SOURCE_URL, {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
    accept: "text/html",
  },
});

if (!response.ok) {
  throw new Error(`Proclub request failed: ${response.status}`);
}

const html = await response.text();
const text = textFromHtml(html);
const matches = parseMatches(text);

if (!matches.length) {
  throw new Error("No Proclub matches found in team page.");
}

const payload = {
  source: SOURCE_URL,
  updatedAt: new Date().toISOString(),
  competition: "FPL - L-Cup S9",
  team: TEAM,
  matches,
};

await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Synced ${matches.length} Proclub matches.`);
