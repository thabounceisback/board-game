// src/data/board.js
export const TILE_TYPES = {
  START: "start",
  RISK: "risk",
  RECON: "recon",
  SAMPLING: "sampling",
  MATERIALITY: "materiality",
  DATA_QUALITY: "data_quality",
  INSIGHT: "insight",
  SHORTCUT: "shortcut",
  SETBACK: "setback",
  BOSS: "boss",
  FINISH: "finish",
  NORMAL: "normal",
  INBOX: "inbox",
};

export const TILE_CONFIG = {
  [TILE_TYPES.START]:        { emoji: "🏁", color: "#2d6a4f",  label: "Start" },
  [TILE_TYPES.RISK]:         { emoji: "⚠️", color: "#e63946",  label: "Risk Event" },
  [TILE_TYPES.RECON]:        { emoji: "📊", color: "#457b9d",  label: "Recon Challenge" },
  [TILE_TYPES.SAMPLING]:     { emoji: "🎯", color: "#e9c46a",  label: "Sampling Test" },
  [TILE_TYPES.MATERIALITY]:  { emoji: "💰", color: "#f4a261",  label: "Materiality" },
  [TILE_TYPES.DATA_QUALITY]: { emoji: "🔍", color: "#264653",  label: "Data Quality" },
  [TILE_TYPES.INSIGHT]:      { emoji: "💡", color: "#06d6a0",  label: "Insight Bonus" },
  [TILE_TYPES.SHORTCUT]:     { emoji: "🚀", color: "#7209b7",  label: "Automation" },
  [TILE_TYPES.SETBACK]:      { emoji: "🐛", color: "#d62828",  label: "Bug Found" },
  [TILE_TYPES.BOSS]:         { emoji: "👔", color: "#1d3557",  label: "Partner Review" },
  [TILE_TYPES.FINISH]:       { emoji: "🏆", color: "#ffd700",  label: "Sign-Off" },
  [TILE_TYPES.NORMAL]:       { emoji: "📋", color: "#6c757d",  label: "Workpaper" },
  [TILE_TYPES.INBOX]:        { emoji: "📬", color: "#4895ef",  label: "Inbox" },
};

// 40 tiles (indices 0–39). Inbox placed at tiles 5,11,17,23,29,34.
export const BOARD_TILES = [
  TILE_TYPES.START,        // 0
  TILE_TYPES.NORMAL,       // 1
  TILE_TYPES.RISK,         // 2
  TILE_TYPES.SAMPLING,     // 3
  TILE_TYPES.NORMAL,       // 4
  TILE_TYPES.INBOX,        // 5
  TILE_TYPES.INSIGHT,      // 6
  TILE_TYPES.NORMAL,       // 7
  TILE_TYPES.RISK,         // 8
  TILE_TYPES.RECON,        // 9
  TILE_TYPES.NORMAL,       // 10
  TILE_TYPES.INBOX,        // 11
  TILE_TYPES.MATERIALITY,  // 12
  TILE_TYPES.DATA_QUALITY, // 13
  TILE_TYPES.RISK,         // 14
  TILE_TYPES.NORMAL,       // 15
  TILE_TYPES.SETBACK,      // 16
  TILE_TYPES.INBOX,        // 17
  TILE_TYPES.SAMPLING,     // 18
  TILE_TYPES.RECON,        // 19
  TILE_TYPES.BOSS,         // 20
  TILE_TYPES.NORMAL,       // 21
  TILE_TYPES.INSIGHT,      // 22
  TILE_TYPES.INBOX,        // 23
  TILE_TYPES.SAMPLING,     // 24
  TILE_TYPES.RISK,         // 25
  TILE_TYPES.DATA_QUALITY, // 26
  TILE_TYPES.NORMAL,       // 27
  TILE_TYPES.SHORTCUT,     // 28
  TILE_TYPES.INBOX,        // 29
  TILE_TYPES.MATERIALITY,  // 30
  TILE_TYPES.SETBACK,      // 31
  TILE_TYPES.DATA_QUALITY, // 32
  TILE_TYPES.NORMAL,       // 33
  TILE_TYPES.INBOX,        // 34
  TILE_TYPES.RECON,        // 35
  TILE_TYPES.SHORTCUT,     // 36
  TILE_TYPES.SETBACK,      // 37
  TILE_TYPES.INSIGHT,      // 38
  TILE_TYPES.FINISH,       // 39
];

export const BOARD_SIZE = BOARD_TILES.length; // 40
