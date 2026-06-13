(function () {
  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];

  function parseLocalDate(match) {
    return new Date(`${match.date}T${match.time || "00:00"}:00+08:00`);
  }

  function monthText(date) {
    return monthNames[date.getMonth()] || "";
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

  async function loadSchedule() {
    const response = await fetch("data/proclub-schedule.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Schedule request failed: ${response.status}`);
    return response.json();
  }

  loadSchedule()
    .then((data) => {
      const matches = (data.matches || []).map((match) => ({ ...match, competition: data.competition }));
      const homeList = document.querySelector("[data-proclub-home-schedule]");
      if (homeList) homeList.innerHTML = matches.slice(0, 4).map(renderHomeCard).join("");

      const scheduleList = document.querySelector("[data-proclub-full-schedule]");
      if (scheduleList) scheduleList.innerHTML = matches.map(renderScheduleCard).join("");

      const updated = document.querySelector("[data-proclub-updated]");
      if (updated && data.updatedAt) {
        const date = new Date(data.updatedAt);
        updated.textContent = `Proclub 自动同步 · ${date.toLocaleString("zh-CN", { hour12: false })}`;
      }
    })
    .catch(() => {
      const updated = document.querySelector("[data-proclub-updated]");
      if (updated) updated.textContent = "Proclub 自动同步暂不可用，显示本地赛程";
    });
})();
