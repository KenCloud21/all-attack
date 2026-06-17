(function () {
  const lineupApi = window.AllAttackLineup;
  if (!lineupApi) return;

  function renderHomeLineup() {
    const pitch = document.querySelector("[data-lineup-home-pitch]");
    if (!pitch) return;

    const lineup = lineupApi.getLineup();
    pitch.querySelectorAll(".lineup-player").forEach((item) => item.remove());

    lineup.slots.forEach((slot) => {
      const player = lineupApi.byId(slot.player);
      if (!player) return;

      const item = document.createElement("div");
      item.className = `lineup-player lp-${slot.key}`;
      item.style.left = `${slot.x}%`;
      item.style.top = `${slot.y}%`;
      item.innerHTML = `
        <div class="lineup-avatar"><img src="${player.img}" alt="${player.name}"></div>
        <div class="lineup-name">${player.name}</div>
        <div class="lineup-pos">${slot.pos}</div>
      `;
      pitch.appendChild(item);
    });

    document.querySelectorAll("[data-lineup-formation]").forEach((item) => {
      item.textContent = lineup.formation;
    });
  }

  renderHomeLineup();
  window.addEventListener("storage", (event) => {
    if (event.key === lineupApi.STORAGE_KEY) renderHomeLineup();
  });
})();
