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

function parseRecord(text) {
  const match = text.match(
    /联赛成绩\s+排名\s+场次\s+胜利\s+失利\s+平局\s+净胜球\s+积分\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(-?\d+)\s+(\d+)/
  );

  if (!match) {
    return {
      rank: null,
      played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      goalDifference: 0,
      points: 0,
    };
  }

  const [, rank, played, wins, losses, draws, goalDifference, points] = match;
  return {
    rank: Number(rank),
    played: Number(played),
    wins: Number(wins),
    losses: Number(losses),
    draws: Number(draws),
    goalDifference: Number(goalDifference),
    points: Number(points),
  };
}

function parseCompletedMatches(text) {
  const start = text.indexOf("未来比赛");
  const end = text.indexOf("球员名册", start);
  const section = text.slice(start, end > start ? end : undefined);
  const datePattern = /(\d{4}-\d{2}-\d{2})\s+\|\s+(\d{2}:\d{2})\s+([^]*?)(?=\d{4}-\d{2}-\d{2}\s+\||$)/g;
  const completed = [];

  for (const item of section.matchAll(datePattern)) {
    const [, date, time, rawBody] = item;
    const body = rawBody.trim().replace(/\s+/g, " ");
    if (body.includes("赛前分析")) continue;

    const scoreMatch = body.match(new RegExp(`(.+?)\\s+(\\d+)\\s*[:\\-]\\s*(\\d+)\\s+(.+)`));
    if (!scoreMatch) continue;

    const [, home, homeScore, awayScore, away] = scoreMatch;
    const cleanHome = home.trim();
    const cleanAway = away.trim();
    if (cleanHome !== TEAM && cleanAway !== TEAM) continue;

    const teamScore = cleanHome === TEAM ? Number(homeScore) : Number(awayScore);
    const opponentScore = cleanHome === TEAM ? Number(awayScore) : Number(homeScore);
    const result = teamScore > opponentScore ? "胜" : teamScore === opponentScore ? "平" : "负";

    completed.push({
      date,
      time,
      home: cleanHome,
      away: cleanAway,
      score: `${homeScore} : ${awayScore}`,
      status: result,
    });
  }

  return completed;
}

function applyCompletedMatches(matches, completedMatches) {
  const byKey = new Map(completedMatches.map((match) => [`${match.date} ${match.time}`, match]));
  return matches.map((match) => {
    const completed = byKey.get(`${match.date} ${match.time}`);
    return completed ? { ...match, ...completed } : match;
  });
}

function calculateStats(matches, record) {
  const finished = matches.filter((match) => /\d+\s*:\s*\d+/.test(match.score || ""));
  let totalGoals = 0;
  let currentWinStreak = 0;
  let longestWinStreak = 0;

  for (const match of finished) {
    const [homeScore, awayScore] = match.score.split(":").map((value) => Number(value.trim()));
    const teamScore = match.home === TEAM ? homeScore : awayScore;
    const opponentScore = match.home === TEAM ? awayScore : homeScore;
    totalGoals += teamScore;

    if (teamScore > opponentScore) {
      currentWinStreak += 1;
      longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
    } else {
      currentWinStreak = 0;
    }
  }

  return {
    ...record,
    totalGoals,
    longestWinStreak,
    championships: 0,
  };
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
const record = parseRecord(text);
const matches = applyCompletedMatches(parseMatches(text), parseCompletedMatches(text));
const stats = calculateStats(matches, record);

if (!matches.length) {
  throw new Error("No Proclub matches found in team page.");
}

const payload = {
  source: SOURCE_URL,
  updatedAt: new Date().toISOString(),
  competition: "FPL - L-Cup S9",
  team: TEAM,
  stats,
  matches,
};

await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Synced ${matches.length} Proclub matches.`);
