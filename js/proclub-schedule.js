(function () {
  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

  function parseLocalDate(match) {
    return new Date(`${match.date}T${match.time || "00:00"}:00+08:00`);
  }

  function monthText(date) {
    return monthNames[date.getMonth()] || "";
  }

  function formatBeijingDateTime(date) {
    return date.toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatMatchMeta(match) {
    return `北京时间 ${match.date} ${match.time} · ${match.competition || "FPL - L-Cup S9"} · ${match.venue || "赛程"}`;
  }

  function statusClass(status) {
    if (status === "胜") return "win";
    if (status === "平") return "draw";
    return "upcoming";
  }

  function renderHomeCard(match) {
    const date = parseLocalDate(match);
    return `
      <div class="match-card">
        <div class="match-date"><div class="day">${date.getDate()}</div><div class="month">${monthText(date)}</div></div>
        <div class="match-info">
          <div class="league">${match.competition || "FPL - L-Cup S9"} · ${match.venue || "赛程"}</div>
          <div class="match-teams"><span class="home">${match.home}</span><span class="vs">VS</span><span class="away">${match.away}</span></div>
        </div>
        <div class="match-score upcoming">${match.score || match.time}</div>
        <span class="match-status ${statusClass(match.status)}">${match.status || "即将"}</span>
      </div>
    `;
  }

  function renderScheduleCard(match, index) {
    const date = parseLocalDate(match);
    return `
      <article class="match-card animate delay-${index % 2 ? "2" : "1"}">
        <div class="date"><div class="day">${date.getDate()}</div><div class="month">${monthText(date)}</div></div>
        <div><div class="league">${match.competition || "FPL - L-Cup S9"} · ${match.venue || "赛程"}</div><div class="teams">${match.home} <span>VS</span> ${match.away}</div></div>
        <div class="score">${match.score || match.time}</div>
        <div class="status next">${match.status || "即将"}</div>
      </article>
    `;
  }

  function renderStats(stats) {
    if (!stats) return;
    document.querySelectorAll("[data-proclub-stat]").forEach((item) => {
      const key = item.dataset.proclubStat;
      if (Object.prototype.hasOwnProperty.call(stats, key)) {
        item.textContent = stats[key] ?? 0;
      }
    });
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function findNextMatch(matches) {
    const now = new Date();
    return matches
      .map((match) => ({ ...match, startsAt: parseLocalDate(match) }))
      .filter((match) => match.startsAt.getTime() > now.getTime())
      .sort((a, b) => a.startsAt - b.startsAt)[0];
  }

  function homeScheduleMatches(matches) {
    const datedMatches = matches
      .map((match) => ({ ...match, startsAt: parseLocalDate(match) }))
      .sort((a, b) => a.startsAt - b.startsAt);
    const upcoming = datedMatches.filter((match) => match.startsAt.getTime() > Date.now());
    return upcoming.length ? upcoming : datedMatches;
  }

  function updateCountdown(match) {
    const card = document.querySelector("[data-next-countdown]");
    if (!card) return;

    if (!match) {
      const title = card.querySelector("[data-countdown-title]");
      const meta = card.querySelector("[data-countdown-meta]");
      if (title) title.textContent = "暂无未来比赛";
      if (meta) meta.textContent = "等待 Proclub 更新下一轮赛程";
      card.querySelectorAll("[data-countdown-days],[data-countdown-hours],[data-countdown-minutes],[data-countdown-seconds]").forEach((el) => {
        el.textContent = "00";
      });
      return;
    }

    const title = card.querySelector("[data-countdown-title]");
    const meta = card.querySelector("[data-countdown-meta]");
    if (title) title.textContent = `${match.home} vs ${match.away}`;
    if (meta) meta.textContent = formatMatchMeta(match);

    const diff = Math.max(0, match.startsAt.getTime() - Date.now());
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const daysEl = card.querySelector("[data-countdown-days]");
    const hoursEl = card.querySelector("[data-countdown-hours]");
    const minutesEl = card.querySelector("[data-countdown-minutes]");
    const secondsEl = card.querySelector("[data-countdown-seconds]");
    if (daysEl) daysEl.textContent = pad(days);
    if (hoursEl) hoursEl.textContent = pad(hours);
    if (minutesEl) minutesEl.textContent = pad(minutes);
    if (secondsEl) secondsEl.textContent = pad(seconds);
  }

  function updateLineupMatch(match) {
    const blocks = document.querySelectorAll("[data-lineup-next-match], .lineup-meta .lineup-match");
    if (!blocks.length) return;

    const matchTitle = match ? `${match.home} vs ${match.away}` : "暂无未来比赛";
    const matchMeta = match ? formatMatchMeta(match) : "等待 Proclub 更新下一轮赛程";

    blocks.forEach((block) => {
      const title = block.querySelector("[data-lineup-match-title]") || block.querySelector("strong");
      let meta = block.querySelector("[data-lineup-match-meta]");
      if (!meta) {
        meta = document.createElement("span");
        block.appendChild(meta);
      }

      if (title) title.textContent = matchTitle;
      if (meta) meta.textContent = matchMeta;
    });

    const inputMatch = document.getElementById("inputMatch");
    const inputDate = document.getElementById("inputDate");
    if (inputMatch) inputMatch.value = matchTitle;
    if (inputDate) inputDate.value = matchMeta;
  }

  function syncLineupFromCountdown() {
    const countdownTitle = document.querySelector("[data-countdown-title]");
    const countdownMeta = document.querySelector("[data-countdown-meta]");
    const blocks = document.querySelectorAll("[data-lineup-next-match], .lineup-meta .lineup-match");
    if (!blocks.length) return;

    blocks.forEach((block) => {
      const lineupTitle = block.querySelector("[data-lineup-match-title]") || block.querySelector("strong");
      let lineupMeta = block.querySelector("[data-lineup-match-meta]");
      if (!lineupMeta) {
        lineupMeta = document.createElement("span");
        block.appendChild(lineupMeta);
      }

      if (countdownTitle && lineupTitle) lineupTitle.textContent = countdownTitle.textContent;
      if (countdownMeta && lineupMeta) lineupMeta.textContent = countdownMeta.textContent;
    });
  }

  function startCountdown(matches) {
    let nextMatch = findNextMatch(matches);
    updateCountdown(nextMatch);
    updateLineupMatch(nextMatch);
    window.setInterval(() => {
      if (!nextMatch || nextMatch.startsAt.getTime() <= Date.now()) {
        nextMatch = findNextMatch(matches);
        updateLineupMatch(nextMatch);
      }
      updateCountdown(nextMatch);
    }, 1000);
  }

  async function loadSchedule() {
    const response = await fetch("data/proclub-schedule.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Schedule request failed: ${response.status}`);
    return response.json();
  }

  syncLineupFromCountdown();

  loadSchedule()
    .then((data) => {
      const matches = (data.matches || []).map((match) => ({ ...match, competition: data.competition }));
      const homeList = document.querySelector("[data-proclub-home-schedule]");
      if (homeList) homeList.innerHTML = homeScheduleMatches(matches).slice(0, 4).map(renderHomeCard).join("");

      const scheduleList = document.querySelector("[data-proclub-full-schedule]");
      if (scheduleList) scheduleList.innerHTML = matches.map(renderScheduleCard).join("");

      renderStats(data.stats);
      startCountdown(matches);

      const updated = document.querySelector("[data-proclub-updated]");
      if (updated && data.updatedAt) {
        const date = new Date(data.updatedAt);
        updated.textContent = `Proclub 自动同步 · 北京时间 ${formatBeijingDateTime(date)}`;
      }
    })
    .catch(() => {
      const updated = document.querySelector("[data-proclub-updated]");
      if (updated) updated.textContent = "Proclub 自动同步暂不可用，显示本地赛程";
      syncLineupFromCountdown();
    });
})();
