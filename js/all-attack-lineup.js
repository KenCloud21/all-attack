(function () {
  const STORAGE_KEY = "allAttackDefaultLineup";

  const players = [
    { id: "3RA-", name: "3RA-", img: "images/avatars/3RA-.png" },
    { id: "82_Lafee", name: "82_Lafee", img: "images/avatars/82_Lafee.png" },
    { id: "Addits", name: "Addits", img: "images/avatars/Addits.png" },
    { id: "Ander_pilro202X", name: "Ander_pilro202X", img: "images/avatars/Ander_pilro202X.png" },
    { id: "Encourage_Frog", name: "Encourage_Frog", img: "images/avatars/Encourage_Frog.png" },
    { id: "hidavid", name: "hidavid", img: "images/avatars/hidavid.png" },
    { id: "JayMarsXx", name: "JayMarsXx", img: "images/avatars/JayMarsXx.png" },
    { id: "Johnnywang315", name: "Johnnywang315", img: "images/avatars/Johnnywang315.png" },
    { id: "Marcoleslie82", name: "Marcoleslie82", img: "images/avatars/Marcoleslie82.png" },
    { id: "MiJi003", name: "MiJi003", img: "images/avatars/MiJi003.png" },
    { id: "PiggyHer0", name: "PiggyHer0", img: "images/avatars/PiggyHer0.png" },
    { id: "Tomas9824", name: "Tomas9824", img: "images/avatars/Tomas9824.png" },
    { id: "UncleJeffChu", name: "UncleJeffChu", img: "images/avatars/UncleJeffChu.png" },
    { id: "Xiamuchen97", name: "Xiamuchen97", img: "images/avatars/Xiamuchen97.png" },
    { id: "xman", name: "xman", img: "images/avatars/xman.png" },
  ];

  const startingPlayers = [
    "PiggyHer0", "82_Lafee", "xman", "MiJi003", "Tomas9824",
    "Xiamuchen97", "3RA-", "Ander_pilro202X", "JayMarsXx", "Johnnywang315", "Addits",
  ];

  const formations = {
    "4-3-3": [
      ["gk", "GK", 50, 94], ["lb", "LB", 14, 76], ["lcb", "CB", 36, 78], ["rcb", "CB", 64, 78], ["rb", "RB", 86, 76],
      ["lcm", "CM", 24, 54], ["cam", "CAM", 50, 43], ["rcm", "CM", 76, 54], ["lw", "LW", 18, 28], ["st", "ST", 50, 20], ["rw", "RW", 82, 28],
    ],
    "4-1-2-3": [
      ["gk", "GK", 50, 94], ["lb", "LB", 14, 76], ["lcb", "CB", 36, 78], ["rcb", "CB", 64, 78], ["rb", "RB", 86, 76],
      ["cdm", "CDM", 50, 58], ["lcm", "CM", 32, 43], ["rcm", "CM", 68, 43], ["lw", "LW", 18, 28], ["st", "ST", 50, 20], ["rw", "RW", 82, 28],
    ],
    "4-4-2": [
      ["gk", "GK", 50, 94], ["lb", "LB", 14, 76], ["lcb", "CB", 36, 78], ["rcb", "CB", 64, 78], ["rb", "RB", 86, 76],
      ["lm", "LM", 14, 50], ["lcm", "CM", 38, 52], ["rcm", "CM", 62, 52], ["rm", "RM", 86, 50], ["lst", "ST", 38, 24], ["rst", "ST", 62, 24],
    ],
    "4-2-3-1": [
      ["gk", "GK", 50, 94], ["lb", "LB", 14, 76], ["lcb", "CB", 36, 78], ["rcb", "CB", 64, 78], ["rb", "RB", 86, 76],
      ["ldm", "CDM", 36, 57], ["rdm", "CDM", 64, 57], ["lam", "LAM", 18, 39], ["cam", "CAM", 50, 36], ["ram", "RAM", 82, 39], ["st", "ST", 50, 19],
    ],
    "3-5-2": [
      ["gk", "GK", 50, 94], ["lcb", "CB", 26, 78], ["cb", "CB", 50, 80], ["rcb", "CB", 74, 78],
      ["lwb", "LWB", 12, 56], ["lcm", "CM", 34, 55], ["cam", "CAM", 50, 42], ["rcm", "CM", 66, 55], ["rwb", "RWB", 88, 56], ["lst", "ST", 38, 22], ["rst", "ST", 62, 22],
    ],
    "3-4-3": [
      ["gk", "GK", 50, 94], ["lcb", "CB", 26, 78], ["cb", "CB", 50, 80], ["rcb", "CB", 74, 78],
      ["lm", "LM", 14, 54], ["lcm", "CM", 38, 56], ["rcm", "CM", 62, 56], ["rm", "RM", 86, 54], ["lw", "LW", 18, 28], ["st", "ST", 50, 20], ["rw", "RW", 82, 28],
    ],
    "5-3-2": [
      ["gk", "GK", 50, 94], ["lwb", "LWB", 10, 74], ["lcb", "CB", 30, 78], ["cb", "CB", 50, 80], ["rcb", "CB", 70, 78], ["rwb", "RWB", 90, 74],
      ["lcm", "CM", 30, 53], ["cam", "CAM", 50, 42], ["rcm", "CM", 70, 53], ["lst", "ST", 38, 22], ["rst", "ST", 62, 22],
    ],
  };

  function createSlots(formationName, playerIds) {
    return formations[formationName].map((item, index) => ({
      key: item[0],
      pos: item[1],
      x: item[2],
      y: item[3],
      player: playerIds[index] || null,
    }));
  }

  function loadSavedLineup() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && formations[saved.formation] && Array.isArray(saved.players)) return saved;
    } catch (error) {}
    return null;
  }

  function getLineup() {
    const saved = loadSavedLineup();
    const formation = saved ? saved.formation : "4-1-2-3";
    const playerIds = saved ? saved.players : startingPlayers;
    return {
      formation,
      players: playerIds,
      slots: createSlots(formation, playerIds),
    };
  }

  function saveLineup(formation, slots) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      formation,
      players: slots.map((slot) => slot.player),
    }));
  }

  function byId(id) {
    return players.find((player) => player.id === id);
  }

  window.AllAttackLineup = {
    STORAGE_KEY,
    players,
    startingPlayers,
    formations,
    defaultFormation: "4-1-2-3",
    createSlots,
    getLineup,
    saveLineup,
    byId,
  };
})();
