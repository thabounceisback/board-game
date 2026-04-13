// src/data/players.js

// Strategy names: "aggressive" | "overconfident" | "chaotic" | "conservative"
// Roll choice: "safe" | "risky"
// Risk tile choice for risk events: "quick" | "deep"
// Recon tile choice for recon events: "auto" | "manual"
// Sampling tile choice: 90 | 95 | 99
// Note: "overconfident" and "chaotic" are resolved dynamically in gameLogic.js
export const AI_STRATEGIES = {
  aggressive:    { roll: "risky",  riskTile: "deep",   reconTile: "auto", samplingTile: 90 },
  conservative:  { roll: "safe",   riskTile: "quick",  reconTile: "manual", samplingTile: 99 },
};

export const PLAYERS = [
  { id: 0, name: "You",             color: "#06d6a0", icon: "🧑‍💻", isHuman: true,  strategy: null },
  { id: 1, name: "Deloitted",       color: "#86bc25", icon: "🏢",  isHuman: false, strategy: "aggressive" },
  { id: 2, name: "PwSee",           color: "#d9534f", icon: "🔴",  isHuman: false, strategy: "overconfident" },
  { id: 3, name: "Ernst & Younger", color: "#ffe600", icon: "🟡",  isHuman: false, strategy: "chaotic" },
  { id: 4, name: "KPMZ",            color: "#0091da", icon: "🔵",  isHuman: false, strategy: "conservative" },
];

export const STARTING_HOURS = 10;
export const PROMOTION_THRESHOLD = 25;
export const PROMOTION_HOURS_RESET = 12;
export const BURNOUT_THRESHOLD = 0;
export const BURNOUT_ADVANCE = -4;
export const BURNOUT_HOURS_RESTORE = 5;
export const PROMOTION_ADVANCE = 4;
export const CLOSING_SPRINT_WINDOW = 6;
export const BOARD_FINISH = 39;
