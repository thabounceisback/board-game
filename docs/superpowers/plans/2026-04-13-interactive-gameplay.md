# Interactive Gameplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing 2-player passive dice-roller into a 5-player interactive game with player choices, Billable Hours currency, a Community Chest card deck, and animated board visuals.

**Architecture:** Split the monolithic `App.jsx` (677 lines) into focused components under `src/components/` and pure data/logic under `src/data/` and `src/utils/`. `App.jsx` becomes a thin orchestrator holding all game state and delegating rendering and logic to dedicated modules.

**Tech Stack:** React 18, Vite 6, Vitest (added), CSS-in-JS inline styles (existing pattern)

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/data/board.js` | Create | TILE_TYPES, TILE_CONFIG, BOARD_TILES (40 tiles inc. Inbox) |
| `src/data/events.js` | Create | EVENTS pool per tile type |
| `src/data/players.js` | Create | 5 player configs + AI strategy definitions |
| `src/data/cards.js` | Create | 15-card Busy Season Chronicles deck |
| `src/utils/gameLogic.js` | Create | Pure functions: dice, deck, AI strategy, hours triggers |
| `src/utils/gameLogic.test.js` | Create | Vitest unit tests for all gameLogic functions |
| `src/components/DiceControl.jsx` | Create | Safe/Risky choice UI + roll button + dice animation |
| `src/components/PlayerPanel.jsx` | Create | 5-player compact leaderboard with hours display |
| `src/components/GameBoard.jsx` | Create | Board rendering, animated tokens, trail glow |
| `src/components/EventModal.jsx` | Create | Tile event modal with choice mechanics + re-roll button |
| `src/components/CardDrawModal.jsx` | Create | Inbox card reveal modal |
| `src/App.jsx` | Rewrite | Thin orchestrator: state + turn loop + AI dispatch |
| `vite.config.js` | Modify | Add Vitest config block |
| `package.json` | Modify | Add vitest dependency, test script |

---

## Task 1: Install Vitest and configure

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

- [ ] **Step 1: Install vitest**

```bash
npm install --save-dev vitest @vitest/ui
```

- [ ] **Step 2: Add test script to package.json**

Open `package.json` and add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Final `scripts` block:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Add vitest config to vite.config.js**

Add `test` block inside `defineConfig({})` after the `plugins` array:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/board-game/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Audit Analytics: The Board Game',
        short_name: 'Audit Game',
        description: 'Navigate from Engagement Kick-Off to Partner Sign-Off in this audit analytics board game!',
        theme_color: '#0a0e17',
        background_color: '#0a0e17',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/board-game/',
        start_url: '/board-game/',
        icons: [
          { src: '/board-game/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/board-game/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/board-game/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'] },
    }),
  ],
  test: {
    environment: 'node',
    globals: true,
  },
});
```

- [ ] **Step 4: Verify vitest runs**

```bash
npm test
```

Expected: "No test files found" (not an error — passes with 0 tests).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.js
git commit -m "chore: add vitest for unit testing"
```

---

## Task 2: Create data files

**Files:**
- Create: `src/data/board.js`
- Create: `src/data/events.js`
- Create: `src/data/players.js`
- Create: `src/data/cards.js`

- [ ] **Step 1: Create src/data/board.js**

```js
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
  [TILE_TYPES.INBOX]:        { emoji: "📬", color: "#f4a261",  label: "Inbox" },
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
```

- [ ] **Step 2: Create src/data/events.js**

```js
// src/data/events.js
export const EVENTS = {
  risk: [
    { text: "Material misstatement detected in revenue!", type: "risk_choice", quickGood: "False positive — advance 2!", quickBad: "Minor error — go back 1.", deepGood: "You traced it to fraud — advance 4!", deepBad: "Pervasive. Go back 4 while you expand testing." },
    { text: "Client changed ERP systems mid-year. How's your data extraction?", type: "risk_choice", quickGood: "Good enough for now — advance 2!", quickBad: "Schema mismatch. Go back 1.", deepGood: "CDM pipeline handles it perfectly — advance 4!", deepBad: "Full rebuild required. Go back 4." },
    { text: "Unusual journal entry patterns flagged by risk scoring.", type: "risk_choice", quickGood: "Probably fine — advance 2!", quickBad: "Worth noting. Go back 1.", deepGood: "Fraud confirmed and documented — advance 4!", deepBad: "Model misfire — wasted time. Go back 3." },
    { text: "Related party transactions surfaced in GL analysis.", type: "risk_choice", quickGood: "Likely disclosed — advance 2!", quickBad: "Need more info. Go back 1.", deepGood: "Fully substantiated — advance 4!", deepBad: "Undisclosed. Expand scope. Go back 4." },
  ],
  recon: [
    { text: "GL-to-TB reconciliation: Does your total match?", type: "recon_choice", manualGood: "Reconciled! Advance 2!", manualBad: "Off by $4.2M. Go back 1.", autoGood: "Pipeline ties perfectly — advance 4!", autoBad: "Automation missed FX adjustments. Go back 3." },
    { text: "Subledger-to-GL recon — can you tie it out?", type: "recon_choice", manualGood: "Manual tie-out complete — advance 2!", manualBad: "Currency gaps. Go back 1.", autoGood: "Script handles all entities — advance 4!", autoBad: "Timeout on large dataset. Go back 3." },
    { text: "Intercompany elimination check across entities.", type: "recon_choice", manualGood: "All eliminations balance — advance 2!", manualBad: "Orphaned entry in Entity 3. Go back 1.", autoGood: "Automated check passes all entities — advance 4!", autoBad: "Logic error in elimination script. Go back 3." },
  ],
  sampling: [
    { text: "Statistical sampling time — pick your confidence level.", type: "sampling_choice" },
    { text: "Testing disbursements — how deep are you going?", type: "sampling_choice" },
    { text: "Revenue sample selection — choose your approach.", type: "sampling_choice" },
  ],
  materiality: [
    { text: "Planning materiality recalculation triggered!", advance: 3 },
    { text: "Performance materiality vs. overall materiality check.", advance: 1 },
  ],
  data_quality: [
    { text: "Data completeness check on GL extract.", type: "dice", good: "100% complete — advance 2!", bad: "Missing 2 months. Go back 3 to re-extract." },
    { text: "Duplicate detection scan on journal entries.", type: "dice", good: "Clean data — advance 1!", bad: "15,000 duplicate rows. Go back 1." },
    { text: "Data type validation across CDM fields.", type: "dice", good: "All fields conform — advance 2!", bad: "Date fields stored as strings. Go back 1." },
  ],
  insight: [
    { text: "Your Claude API analysis surfaces a key finding!", advance: 3 },
    { text: "Automated trend analysis reveals a cost optimization. Client loves it!", advance: 2 },
    { text: "Your PySpark notebook runs 10x faster than last year's approach!", advance: 2 },
    { text: "Risk scoring model catches what manual review missed!", advance: 3 },
  ],
  shortcut: [
    { text: "You automated the entire procedure with pyod! Skip ahead!", advance: 4 },
    { text: "Databricks pipeline completes overnight. Jump forward!", advance: 3 },
    { text: "Reusable notebook from prior engagement saves days!", advance: 3 },
  ],
  setback: [
    { text: "Databricks cluster timed out during peak hours.", advance: -3 },
    { text: "Client sent wrong GL extract — back to data intake.", advance: -4 },
    { text: "Notebook code review found a PySpark anti-pattern.", advance: -2 },
  ],
  boss: [
    { text: "PARTNER REVIEW: Present your findings to the engagement partner!", type: "boss", pass: "Partner signs off — advance 4!", fail: "Partner has 12 review notes. Go back 3." },
  ],
};
```

- [ ] **Step 3: Create src/data/players.js**

```js
// src/data/players.js

// Strategy names: "aggressive" | "overconfident" | "chaotic" | "conservative"
// Roll choice: "safe" | "risky"
// Risk choice: "quick" | "deep"
// Recon choice: "manual" | "automated"
// Sampling choice: 90 | 95 | 99
export const AI_STRATEGIES = {
  aggressive:    { roll: "risky",  riskTile: "deep",   reconTile: "automated", samplingTile: 90 },
  conservative:  { roll: "safe",   riskTile: "quick",  reconTile: "manual",    samplingTile: 99 },
  // "overconfident" and "chaotic" are resolved dynamically in gameLogic.js
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
export const CLOSING_SPRINT_WINDOW = 6; // tiles from finish
export const BOARD_FINISH = 39;
```

- [ ] **Step 4: Create src/data/cards.js**

```js
// src/data/cards.js
// type: "bad" | "good" | "chaos" | "nuclear"
// tileDelta: number (positive = advance, negative = go back, 0 = no movement)
// hoursDelta: number
// halfNextRoll: boolean (LOOP card)
// nuclear: boolean (removed from deck after firing once)

export const CARD_DECK = [
  {
    id: 1,
    title: '"pls fix"',
    emoji: "😐",
    flavor: "Partner leaves a single two-word review comment. No context. No explanation. It is 11:47pm.",
    tileDelta: -2,
    hoursDelta: -2,
    type: "bad",
  },
  {
    id: 2,
    title: "SALY Approved",
    emoji: "🙏",
    flavor: '"Same as last year." Your prior year workpaper gets signed off without a single question. The system works.',
    tileDelta: 2,
    hoursDelta: 3,
    type: "good",
  },
  {
    id: 3,
    title: '"Just 3 More Entities"',
    emoji: "📈",
    flavor: "Client casually mentions they acquired three subsidiaries in Q4. During fieldwork. On a Friday.",
    tileDelta: -3,
    hoursDelta: -3,
    type: "bad",
  },
  {
    id: 4,
    title: "Wrong Year on the Memo",
    emoji: "💀",
    flavor: "You copy-pasted last year's memo header. The date says 2023. It is 2025. Partner noticed. So did the client.",
    tileDelta: -1,
    hoursDelta: -1,
    type: "chaos",
  },
  {
    id: 5,
    title: "Recon to TB: Still Broken",
    emoji: "🥲",
    flavor: "You've been trying to tie this out since Monday. It is now Thursday. The $847 difference has not explained itself.",
    tileDelta: -2,
    hoursDelta: -3,
    type: "bad",
  },
  {
    id: 6,
    title: "Last Year's Code Works As-Is",
    emoji: "🤌",
    flavor: "You open the prior year notebook with zero hope. It runs. All cells. Clean output. You didn't change a thing.",
    tileDelta: 3,
    hoursDelta: 2,
    type: "good",
  },
  {
    id: 7,
    title: "LOOP Surveys Due",
    emoji: "😩",
    flavor: "You have 14 outstanding LOOP surveys. Your counselor has sent 3 reminders. It is busy season. There is no good time.",
    tileDelta: 0,
    hoursDelta: -2,
    halfNextRoll: true,
    type: "bad",
  },
  {
    id: 8,
    title: "Year-End Bonus Just Hit",
    emoji: "🤑",
    flavor: "It's smaller than you expected and larger than your friend at a regional firm got. You'll take it.",
    tileDelta: 2,
    hoursDelta: 5,
    type: "good",
  },
  {
    id: 9,
    title: "Start the Engagement Over",
    emoji: "🫠",
    flavor: "Independence violation discovered. Scope was wrong from day one. The partner just found out. So did the PCAOB.",
    tileDelta: "RETURN_TO_START",
    hoursDelta: "LOSE_ALL",
    type: "nuclear",
    nuclear: true,
  },
  {
    id: 10,
    title: "Staff Forgot to Tick and Tie",
    emoji: "🤦",
    flavor: "Your staff sent the workpaper for review. Nothing is cross-referenced. You're fixing it yourself. Again.",
    tileDelta: -1,
    hoursDelta: -1,
    type: "bad",
  },
  {
    id: 11,
    title: "Partner's on the Golf Course",
    emoji: "⛳",
    flavor: "Partner is unavailable for review this week. All notes deferred. You breathe for the first time since January.",
    tileDelta: 2,
    hoursDelta: 1,
    type: "good",
  },
  {
    id: 12,
    title: "Charged to Wrong Engagement Code",
    emoji: "😬",
    flavor: "You've been billing to a closed engagement for three weeks. Finance is not pleased. Neither is the engagement partner.",
    tileDelta: 0,
    hoursDelta: -3,
    type: "bad",
  },
  {
    id: 13,
    title: "Promoted to Manager! 🎉",
    emoji: "🏅",
    flavor: "The promotion email came through at 5pm on a Friday. Your inbox immediately fills with new delegation requests.",
    tileDelta: 3,
    hoursDelta: 2,
    type: "good",
  },
  {
    id: 14,
    title: "Busy Season: No PTO Approved",
    emoji: "😶",
    flavor: "You submitted the request six weeks ago. The answer is no. It will always be no until April 16th.",
    tileDelta: 0,
    hoursDelta: -2,
    type: "bad",
  },
  {
    id: 15,
    title: "Senior Left the Firm",
    emoji: "👋",
    flavor: "Your senior gave two weeks notice. You inherit their workpapers, their clients, and their unresolved review notes.",
    tileDelta: 2,
    hoursDelta: 1,
    type: "chaos",
  },
];
```

- [ ] **Step 5: Commit**

```bash
git add src/data/
git commit -m "feat: add data files for board, events, players, and card deck"
```

---

## Task 3: Create gameLogic.js with TDD

**Files:**
- Create: `src/utils/gameLogic.js`
- Create: `src/utils/gameLogic.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/utils/gameLogic.test.js`:

```js
import { describe, it, expect, vi } from "vitest";
import {
  rollDice,
  isDoubles,
  shuffleDeck,
  drawCard,
  resolveAIRollChoice,
  resolveAITileChoice,
  applyHoursDelta,
  checkPromotion,
  checkBurnout,
  checkClosingSprint,
} from "./gameLogic";
import { CARD_DECK } from "../data/cards";
import { PLAYERS, STARTING_HOURS, PROMOTION_THRESHOLD } from "../data/players";

describe("rollDice", () => {
  it("returns an array of the requested length", () => {
    const result = rollDice(2);
    expect(result).toHaveLength(2);
  });
  it("each die is between 1 and 6", () => {
    for (let i = 0; i < 50; i++) {
      const [d] = rollDice(1);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    }
  });
});

describe("isDoubles", () => {
  it("returns true when both dice match", () => {
    expect(isDoubles([3, 3])).toBe(true);
  });
  it("returns false when dice differ", () => {
    expect(isDoubles([2, 4])).toBe(false);
  });
  it("returns false for a single die", () => {
    expect(isDoubles([5])).toBe(false);
  });
});

describe("shuffleDeck", () => {
  it("returns an array of the same length", () => {
    const shuffled = shuffleDeck(CARD_DECK);
    expect(shuffled).toHaveLength(CARD_DECK.length);
  });
  it("contains all the same card ids", () => {
    const shuffled = shuffleDeck(CARD_DECK);
    const originalIds = CARD_DECK.map((c) => c.id).sort();
    const shuffledIds = shuffled.map((c) => c.id).sort();
    expect(shuffledIds).toEqual(originalIds);
  });
  it("does not mutate the original array", () => {
    const original = [...CARD_DECK];
    shuffleDeck(CARD_DECK);
    expect(CARD_DECK[0].id).toBe(original[0].id);
  });
});

describe("drawCard", () => {
  it("returns the top card and the remaining deck", () => {
    const deck = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const { card, remaining } = drawCard(deck, []);
    expect(card.id).toBe(1);
    expect(remaining).toHaveLength(2);
  });
  it("reshuffles discard (minus nuclear) when deck is empty", () => {
    const nuclearCard = CARD_DECK.find((c) => c.nuclear);
    const discard = [{ id: 99 }, nuclearCard];
    const { card, remaining } = drawCard([], discard);
    expect(card).not.toBeNull();
    // nuclear card must not appear in the reshuffled deck
    expect(remaining.some((c) => c.nuclear)).toBe(false);
    expect(card.nuclear).toBeFalsy();
  });
  it("returns null card when deck and discard are both empty", () => {
    const { card } = drawCard([], []);
    expect(card).toBeNull();
  });
});

describe("resolveAIRollChoice", () => {
  it("aggressive always returns risky", () => {
    expect(resolveAIRollChoice("aggressive", { position: 5, humanPosition: 5 })).toBe("risky");
  });
  it("conservative always returns safe", () => {
    expect(resolveAIRollChoice("conservative", { position: 5, humanPosition: 5 })).toBe("safe");
  });
  it("overconfident returns risky when 5+ ahead of human", () => {
    expect(resolveAIRollChoice("overconfident", { position: 20, humanPosition: 15 })).toBe("risky");
  });
  it("overconfident returns safe when behind", () => {
    expect(resolveAIRollChoice("overconfident", { position: 10, humanPosition: 15 })).toBe("safe");
  });
  it("chaotic returns either safe or risky", () => {
    const choices = new Set();
    for (let i = 0; i < 50; i++) {
      choices.add(resolveAIRollChoice("chaotic", { position: 5, humanPosition: 5 }));
    }
    expect(choices.has("safe")).toBe(true);
    expect(choices.has("risky")).toBe(true);
  });
});

describe("resolveAITileChoice", () => {
  it("aggressive picks deep/automated/90", () => {
    const r = resolveAITileChoice("aggressive", "risk");
    expect(r).toBe("deep");
    expect(resolveAITileChoice("aggressive", "recon")).toBe("automated");
    expect(resolveAITileChoice("aggressive", "sampling")).toBe(90);
  });
  it("conservative picks quick/manual/99", () => {
    expect(resolveAITileChoice("conservative", "risk")).toBe("quick");
    expect(resolveAITileChoice("conservative", "recon")).toBe("manual");
    expect(resolveAITileChoice("conservative", "sampling")).toBe(99);
  });
});

describe("applyHoursDelta", () => {
  it("adds positive delta", () => {
    expect(applyHoursDelta(10, 3)).toBe(13);
  });
  it("subtracts negative delta but floors at 0", () => {
    expect(applyHoursDelta(2, -5)).toBe(0);
  });
  it("handles LOSE_ALL by returning 0", () => {
    expect(applyHoursDelta(15, "LOSE_ALL")).toBe(0);
  });
});

describe("checkPromotion", () => {
  it("returns true when hours reach threshold", () => {
    expect(checkPromotion(PROMOTION_THRESHOLD)).toBe(true);
  });
  it("returns false below threshold", () => {
    expect(checkPromotion(PROMOTION_THRESHOLD - 1)).toBe(false);
  });
});

describe("checkBurnout", () => {
  it("returns true when hours are 0", () => {
    expect(checkBurnout(0)).toBe(true);
  });
  it("returns false above 0", () => {
    expect(checkBurnout(1)).toBe(false);
  });
});

describe("checkClosingSprint", () => {
  it("returns the qualifying player index when conditions met", () => {
    const players = [
      { position: 35, hours: 20 },
      { position: 10, hours: 5 },
      { position: 20, hours: 3 },
      { position: 5,  hours: 2 },
      { position: 8,  hours: 1 },
    ];
    // Player 0 is within 6 of finish (39) and has most hours
    expect(checkClosingSprint(players, false)).toBe(0);
  });
  it("returns null when already used", () => {
    const players = [{ position: 35, hours: 20 }, { position: 10, hours: 5 }];
    expect(checkClosingSprint(players, true)).toBeNull();
  });
  it("returns null when no player is within 6 tiles of finish", () => {
    const players = [{ position: 20, hours: 20 }, { position: 15, hours: 5 }];
    expect(checkClosingSprint(players, false)).toBeNull();
  });
  it("returns null when the qualifying player does not have the most hours", () => {
    const players = [
      { position: 35, hours: 5 },
      { position: 10, hours: 20 },
    ];
    expect(checkClosingSprint(players, false)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
npm test
```

Expected: Multiple failures — "Cannot find module './gameLogic'"

- [ ] **Step 3: Implement gameLogic.js**

Create `src/utils/gameLogic.js`:

```js
// src/utils/gameLogic.js
import { shuffleDeck as _shuffle } from "./shuffle";
import {
  PROMOTION_THRESHOLD,
  BURNOUT_THRESHOLD,
  CLOSING_SPRINT_WINDOW,
  BOARD_FINISH,
} from "../data/players";
import { AI_STRATEGIES } from "../data/players";

// --- Dice ---

export function rollDice(count) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

export function isDoubles(dice) {
  return dice.length === 2 && dice[0] === dice[1];
}

// --- Deck ---

export function shuffleDeck(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Draw the top card from deck.
 * If deck is empty, reshuffle discard (excluding nuclear cards) into a new deck.
 * Returns { card, remaining, newDiscard }.
 */
export function drawCard(deck, discard) {
  if (deck.length === 0) {
    const reshufflable = discard.filter((c) => !c.nuclear);
    if (reshufflable.length === 0) return { card: null, remaining: [], newDiscard: discard };
    const newDeck = shuffleDeck(reshufflable);
    const card = newDeck[0];
    return { card, remaining: newDeck.slice(1), newDiscard: discard.filter((c) => c.nuclear) };
  }
  const card = deck[0];
  return { card, remaining: deck.slice(1), newDiscard: discard };
}

// --- AI strategy ---

/**
 * Returns "safe" | "risky" based on the player's strategy.
 * context: { position, humanPosition }
 */
export function resolveAIRollChoice(strategy, context) {
  if (strategy === "aggressive") return "risky";
  if (strategy === "conservative") return "safe";
  if (strategy === "chaotic") return Math.random() < 0.5 ? "safe" : "risky";
  if (strategy === "overconfident") {
    return context.position - context.humanPosition >= 5 ? "risky" : "safe";
  }
  return "safe";
}

/**
 * Returns the tile choice for a given tile type.
 * tileType: "risk" | "recon" | "sampling"
 * Returns "quick"|"deep" for risk, "manual"|"automated" for recon, 90|95|99 for sampling.
 */
export function resolveAITileChoice(strategy, tileType) {
  if (strategy === "aggressive") {
    if (tileType === "risk") return "deep";
    if (tileType === "recon") return "automated";
    if (tileType === "sampling") return 90;
  }
  if (strategy === "conservative") {
    if (tileType === "risk") return "quick";
    if (tileType === "recon") return "manual";
    if (tileType === "sampling") return 99;
  }
  if (strategy === "chaotic") {
    if (tileType === "risk") return Math.random() < 0.5 ? "quick" : "deep";
    if (tileType === "recon") return Math.random() < 0.5 ? "manual" : "automated";
    if (tileType === "sampling") return [90, 95, 99][Math.floor(Math.random() * 3)];
  }
  if (strategy === "overconfident") {
    // Same as aggressive for tile choices
    if (tileType === "risk") return "deep";
    if (tileType === "recon") return "automated";
    if (tileType === "sampling") return 90;
  }
  return tileType === "sampling" ? 95 : "quick";
}

// --- Hours ---

/** Apply a delta to hours. delta may be a number or "LOSE_ALL". Returns new hours value (floored at 0). */
export function applyHoursDelta(hours, delta) {
  if (delta === "LOSE_ALL") return 0;
  return Math.max(0, hours + delta);
}

/** Returns true if hours have reached the promotion threshold. */
export function checkPromotion(hours) {
  return hours >= PROMOTION_THRESHOLD;
}

/** Returns true if hours have hit burnout (0). */
export function checkBurnout(hours) {
  return hours <= BURNOUT_THRESHOLD;
}

/**
 * Returns the index of the player who qualifies for the Closing Sprint bonus, or null.
 * Conditions: within CLOSING_SPRINT_WINDOW tiles of finish AND strictly most hours.
 * closingSprintUsed: boolean — if true, returns null immediately.
 */
export function checkClosingSprint(players, closingSprintUsed) {
  if (closingSprintUsed) return null;
  const maxHours = Math.max(...players.map((p) => p.hours));
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const tilesFromFinish = BOARD_FINISH - p.position;
    if (tilesFromFinish <= CLOSING_SPRINT_WINDOW && tilesFromFinish > 0 && p.hours === maxHours) {
      // Check strictly most (no tie with other eligible players)
      const othersWithSameHours = players.filter(
        (other, idx) => idx !== i && other.hours === maxHours
      );
      if (othersWithSameHours.length === 0) return i;
      // Tiebreaker: furthest along board
      const tiedAndFurther = othersWithSameHours.some((other) => other.position >= p.position);
      if (!tiedAndFurther) return i;
    }
  }
  return null;
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npm test
```

Expected: All tests pass (green).

- [ ] **Step 5: Commit**

```bash
git add src/utils/gameLogic.js src/utils/gameLogic.test.js
git commit -m "feat: add gameLogic utilities with full test coverage"
```

---

## Task 4: Build DiceControl component

**Files:**
- Create: `src/components/DiceControl.jsx`

- [ ] **Step 1: Create DiceControl.jsx**

```jsx
// src/components/DiceControl.jsx
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const font = "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace";

export default function DiceControl({
  diceValues,       // number[] — current face values shown (1 or 2 dice)
  rolling,          // boolean
  gameState,        // "playing" | "event" | "gameover" | "menu"
  currentPlayerIsHuman,
  onRollChoice,     // (choice: "safe" | "risky") => void — called when human picks roll type
  pendingRollChoice, // "safe" | "risky" | null — null means choice not made yet
  onRoll,           // () => void — called after choice is locked in
  rivalTurnMessage, // string | null — shown when AI is rolling
}) {
  const panelBg = "#111827";
  const borderColor = "#1e3a5f";

  return (
    <div style={{
      background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10,
      padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    }}>
      {/* Dice faces */}
      <div style={{ display: "flex", gap: 8 }}>
        {diceValues.map((val, i) => (
          <div key={i} style={{
            fontSize: 56,
            lineHeight: 1,
            transition: "transform 0.2s",
            transform: rolling ? "rotate(360deg) scale(1.2)" : "scale(1)",
            animation: rolling ? "diceShake 0.15s infinite" : "none",
          }}>
            {DICE_FACES[val - 1]}
          </div>
        ))}
      </div>

      {/* Human choosing roll type */}
      {gameState === "playing" && currentPlayerIsHuman && !pendingRollChoice && !rolling && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#6b7f99", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Choose your roll
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onRollChoice("safe")} style={{
              padding: "8px 16px", fontSize: 11, fontWeight: 700, fontFamily: font,
              background: "#2d6a4f33", color: "#06d6a0",
              border: "1px solid #06d6a066", borderRadius: 6, cursor: "pointer",
              textTransform: "uppercase", letterSpacing: 1,
            }}>
              🛡 Safe (1d6)
            </button>
            <button onClick={() => onRollChoice("risky")} style={{
              padding: "8px 16px", fontSize: 11, fontWeight: 700, fontFamily: font,
              background: "#e6394622", color: "#e63946",
              border: "1px solid #e6394666", borderRadius: 6, cursor: "pointer",
              textTransform: "uppercase", letterSpacing: 1,
            }}>
              🎲 Risky (2d6)
            </button>
          </div>
          <div style={{ fontSize: 9, color: "#6b7f99", marginTop: 6 }}>
            Risky: doubles = advance sum ×2 🔥
          </div>
        </div>
      )}

      {/* Human has chosen, ready to roll */}
      {gameState === "playing" && currentPlayerIsHuman && pendingRollChoice && !rolling && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: pendingRollChoice === "risky" ? "#e63946" : "#06d6a0", marginBottom: 8 }}>
            {pendingRollChoice === "risky" ? "🎲 Risky Roll selected" : "🛡 Safe Roll selected"}
          </div>
          <button onClick={onRoll} style={{
            padding: "10px 32px", fontSize: 13, fontWeight: 700,
            fontFamily: "'Orbitron', sans-serif", letterSpacing: 1,
            background: pendingRollChoice === "risky"
              ? "linear-gradient(135deg, #e63946, #d62828)"
              : "linear-gradient(135deg, #06d6a0, #2d6a4f)",
            color: "#0a0e17", border: "none", borderRadius: 6, cursor: "pointer",
            textTransform: "uppercase",
          }}>
            Roll Dice
          </button>
        </div>
      )}

      {/* Rolling animation label */}
      {rolling && (
        <div style={{ fontSize: 11, color: "#e9c46a", animation: "pulse 0.8s infinite" }}>
          Rolling...
        </div>
      )}

      {/* AI turn message */}
      {gameState === "playing" && !currentPlayerIsHuman && rivalTurnMessage && !rolling && (
        <div style={{ fontSize: 11, color: "#6b7f99", animation: "pulse 0.8s infinite", textAlign: "center" }}>
          {rivalTurnMessage}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173/board-game/`. Component isn't rendered yet — this step is just confirming no syntax errors (Vite will show them).

- [ ] **Step 3: Commit**

```bash
git add src/components/DiceControl.jsx
git commit -m "feat: add DiceControl with safe/risky roll choice UI"
```

---

## Task 5: Build PlayerPanel component

**Files:**
- Create: `src/components/PlayerPanel.jsx`

- [ ] **Step 1: Create PlayerPanel.jsx**

```jsx
// src/components/PlayerPanel.jsx
import { BOARD_FINISH, PROMOTION_THRESHOLD } from "../data/players";

export default function PlayerPanel({ players, currentPlayer, gameState, gameSpeed, onToggleSpeed }) {
  const panelBg = "#111827";
  const borderColor = "#1e3a5f";
  const font = "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace";

  return (
    <div style={{
      background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 10,
    }}>
      {/* Header row */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 8,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7f99", textTransform: "uppercase", letterSpacing: 1 }}>
          Firms
        </div>
        <button onClick={onToggleSpeed} style={{
          fontSize: 9, padding: "2px 8px", background: "#1e3a5f",
          color: "#9ab0c6", border: "1px solid #457b9d", borderRadius: 4, cursor: "pointer",
          fontFamily: font,
        }}>
          {gameSpeed === "fast" ? "⚡ Fast" : "🐢 Normal"}
        </button>
      </div>

      {players.map((p, i) => {
        const isActive = currentPlayer === i && gameState === "playing";
        const progress = (p.position / BOARD_FINISH) * 100;
        const hoursProgress = Math.min((p.hours / PROMOTION_THRESHOLD) * 100, 100);
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 6px", borderRadius: 6,
            marginBottom: i < players.length - 1 ? 4 : 0,
            background: isActive ? `${p.color}18` : "transparent",
            border: isActive ? `1px solid ${p.color}44` : "1px solid transparent",
            animation: isActive ? "glowBorder 2s infinite" : "none",
            transition: "background 0.3s",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: p.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.name}
              </div>
              {/* Position bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <div style={{ flex: 1, height: 4, background: "#1a2332", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    width: `${progress}%`, height: "100%",
                    background: p.color, borderRadius: 2,
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <span style={{ fontSize: 8, color: "#6b7f99", flexShrink: 0 }}>{p.position}/{BOARD_FINISH}</span>
              </div>
              {/* Hours bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <div style={{ flex: 1, height: 3, background: "#1a2332", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    width: `${hoursProgress}%`, height: "100%",
                    background: "#e9c46a", borderRadius: 2,
                    transition: "width 0.4s ease",
                  }} />
                </div>
                <span style={{ fontSize: 8, color: "#e9c46a", flexShrink: 0 }}>⏱️ {p.hours}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PlayerPanel.jsx
git commit -m "feat: add 5-player compact PlayerPanel with hours display"
```

---

## Task 6: Build GameBoard component

**Files:**
- Create: `src/components/GameBoard.jsx`

- [ ] **Step 1: Create GameBoard.jsx**

```jsx
// src/components/GameBoard.jsx
import { BOARD_TILES, TILE_CONFIG, BOARD_SIZE } from "../data/board";

const COLS = 8;
const TILE_SIZE = 64;
const GAP = 6;
const BOARD_W = COLS * (TILE_SIZE + GAP) + GAP;
const ROWS = Math.ceil(BOARD_SIZE / COLS);
const BOARD_H = ROWS * (TILE_SIZE + GAP) + GAP;

function getTilePosition(index) {
  const row = Math.floor(index / COLS);
  const colRaw = index % COLS;
  const col = row % 2 === 0 ? colRaw : COLS - 1 - colRaw;
  return {
    x: col * (TILE_SIZE + GAP) + GAP,
    y: row * (TILE_SIZE + GAP) + GAP,
  };
}

// Returns opacity for trail tile: 1=most recent, 2=older, 3=oldest
function getTrailOpacity(depth) {
  if (depth === 1) return 0.4;
  if (depth === 2) return 0.2;
  return 0.08;
}

export default function GameBoard({ players, currentPlayer, gameState, trailHistory }) {
  // trailHistory: number[][] — trailHistory[playerIdx] = [tile-1, tile-2, tile-3]

  const panelBg = "#111827";
  const borderColor = "#1e3a5f";

  // Build a map: tileIndex -> { trail: [{playerIdx, depth}], tokens: [playerIdx] }
  const tileData = {};
  for (let i = 0; i < BOARD_SIZE; i++) {
    tileData[i] = { trails: [], tokens: [] };
  }

  players.forEach((p, pi) => {
    tileData[p.position].tokens.push(pi);
    (trailHistory[pi] || []).forEach((tileIdx, depth) => {
      if (tileIdx !== p.position && tileData[tileIdx]) {
        tileData[tileIdx].trails.push({ playerIdx: pi, depth: depth + 1 });
      }
    });
  });

  return (
    <div style={{
      background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10,
      padding: 10, position: "relative", flexShrink: 0,
      width: BOARD_W + 20, minHeight: BOARD_H + 20,
    }}>
      <div style={{ position: "relative", width: BOARD_W, height: BOARD_H }}>
        {BOARD_TILES.map((tileType, i) => {
          const pos = getTilePosition(i);
          const cfg = TILE_CONFIG[tileType];
          const { tokens, trails } = tileData[i];
          const hasTokens = tokens.length > 0;
          const hasTrails = trails.length > 0;

          // Strongest trail glow for this tile
          const strongestTrail = trails.reduce((best, t) =>
            !best || t.depth < best.depth ? t : best, null);

          return (
            <div key={i} style={{
              position: "absolute", left: pos.x, top: pos.y,
              width: TILE_SIZE, height: TILE_SIZE,
              background: `${cfg.color}22`,
              border: `2px solid ${cfg.color}66`,
              borderRadius: 6,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              fontSize: 10, color: cfg.color,
              transition: "box-shadow 0.4s",
              boxShadow: hasTokens
                ? `0 0 14px ${players[tokens[0]].color}99`
                : hasTrails
                  ? `0 0 8px ${players[strongestTrail.playerIdx].color}${Math.round(getTrailOpacity(strongestTrail.depth) * 255).toString(16).padStart(2, "0")}`
                  : "none",
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{cfg.emoji}</span>
              <span style={{ fontSize: 8, marginTop: 2, opacity: 0.8, textAlign: "center", lineHeight: 1.1 }}>
                {i === 0 ? "START" : i === BOARD_SIZE - 1 ? "FINISH" : cfg.label}
              </span>
              <span style={{ fontSize: 7, opacity: 0.4 }}>{i}</span>

              {/* Player tokens */}
              {hasTokens && (
                <div style={{ position: "absolute", bottom: -4, display: "flex", gap: 1 }}>
                  {tokens.slice(0, 3).map((pi, ti) => (
                    <span key={ti} style={{
                      fontSize: pi === 0 ? 18 : 14,
                      filter: `drop-shadow(0 0 4px ${players[pi].color})`,
                      opacity: pi === currentPlayer && gameState === "playing" ? 1 : 0.75,
                      animation: pi === currentPlayer && gameState === "playing" ? "pulse 1s infinite" : "none",
                      transition: "all 0.35s ease",
                    }}>
                      {players[pi].icon}
                    </span>
                  ))}
                  {tokens.length > 3 && (
                    <span style={{ fontSize: 9, color: "#e9c46a", alignSelf: "center" }}>
                      +{tokens.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { BOARD_W, BOARD_H };
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GameBoard.jsx
git commit -m "feat: add GameBoard with animated trail glow and token stacking"
```

---

## Task 7: Build EventModal component

**Files:**
- Create: `src/components/EventModal.jsx`

- [ ] **Step 1: Create EventModal.jsx**

```jsx
// src/components/EventModal.jsx
import { BOARD_TILES, TILE_CONFIG } from "../data/board";

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const font = "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace";

// Sampling outcome table
const SAMPLING_OUTCOMES = {
  90: { label: "90% Confidence", color: "#e63946", n: "n=25", roll: (r) => r <= 3 ? { spaces: -3, success: false } : { spaces: 5, success: true } },
  95: { label: "95% Confidence", color: "#e9c46a", n: "n=59", roll: (r) => r <= 2 ? { spaces: -1, success: false } : { spaces: 3, success: true } },
  99: { label: "99% Confidence", color: "#06d6a0", n: "n=148", guaranteed: { spaces: 2, success: true } },
};

export default function EventModal({
  currentEvent,      // event object from EVENTS or null
  eventPhase,        // "show" | "choice" | "resolve"
  eventResult,       // { roll?, success, text, spaces } | null
  currentPlayerIdx,
  players,
  playerHours,       // number — current player's hours
  onRiskChoice,      // (choice: "quick" | "deep") => void
  onReconChoice,     // (choice: "manual" | "automated") => void
  onSamplingChoice,  // (choice: 90 | 95 | 99) => void
  onRollForEvent,    // () => void
  onDismiss,         // () => void
  onSpendHours,      // () => void — spend 3 hours to re-roll
  canSpendHours,     // boolean — playerHours >= 3 and re-roll not yet used
}) {
  if (!currentEvent) return null;
  const player = players[currentPlayerIdx];
  const tileType = BOARD_TILES[player.position];
  const cfg = TILE_CONFIG[tileType];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      padding: 16,
    }}
    onClick={(e) => { if (e.target === e.currentTarget && eventPhase === "resolve") onDismiss(); }}
    >
      <div style={{
        background: "#111827", border: "1px solid #1e3a5f", borderRadius: 12,
        padding: "28px 32px", maxWidth: 420, width: "100%",
        animation: "slideUp 0.3s ease",
        boxShadow: "0 0 60px rgba(6,214,160,0.15)",
      }}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 6 }}>{cfg.emoji}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e0e7ef", textAlign: "center", marginBottom: 4 }}>
          {cfg.label}
        </div>
        <div style={{ fontSize: 13, color: "#9ab0c6", textAlign: "center", marginBottom: 20, lineHeight: 1.6 }}>
          {currentEvent.text}
        </div>

        {/* RISK choice */}
        {eventPhase === "choice" && currentEvent.type === "risk_choice" && (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => onRiskChoice("quick")} style={choiceBtn("#457b9d")}>
              🔍 Quick Review<br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>Pass on 3+ · ±2 tiles</span>
            </button>
            <button onClick={() => onRiskChoice("deep")} style={choiceBtn("#e63946")}>
              🔎 Deep Dive<br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>Pass on 4+ · ±4 tiles</span>
            </button>
          </div>
        )}

        {/* RECON choice */}
        {eventPhase === "choice" && currentEvent.type === "recon_choice" && (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => onReconChoice("manual")} style={choiceBtn("#457b9d")}>
              📝 Manual<br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>Pass on 3+ · ±2 tiles</span>
            </button>
            <button onClick={() => onReconChoice("automated")} style={choiceBtn("#7209b7")}>
              🤖 Automated<br />
              <span style={{ fontSize: 9, opacity: 0.7 }}>Pass on 4+ · ±4 tiles</span>
            </button>
          </div>
        )}

        {/* SAMPLING choice */}
        {eventPhase === "choice" && currentEvent.type === "sampling_choice" && (
          <div style={{ display: "flex", gap: 8 }}>
            {[90, 95, 99].map((conf) => {
              const s = SAMPLING_OUTCOMES[conf];
              return (
                <button key={conf} onClick={() => onSamplingChoice(conf)} style={choiceBtn(s.color)}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{conf}%</span><br />
                  <span style={{ fontSize: 9, color: "#6b7f99" }}>{s.n}</span><br />
                  <span style={{ fontSize: 9, opacity: 0.8 }}>
                    {s.guaranteed ? `+${s.guaranteed.spaces} tiles` : "Roll d6"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Roll button (dice/boss/after choice) */}
        {eventPhase === "show" && (currentEvent.type === "dice" || currentEvent.type === "boss") && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#6b7f99", marginBottom: 8 }}>
              {currentEvent.type === "boss" ? "Roll 4+ to pass the partner review" : "Roll 3+ to succeed"}
            </div>
            <button onClick={onRollForEvent} style={primaryBtn}>Roll for it!</button>
          </div>
        )}

        {/* Resolve phase */}
        {eventPhase === "resolve" && eventResult && (
          <div style={{ textAlign: "center" }}>
            {eventResult.roll != null && (
              <div style={{ fontSize: 48, marginBottom: 8 }}>{DICE_FACES[eventResult.roll - 1]}</div>
            )}
            <div style={{ fontSize: 16, fontWeight: 700, color: eventResult.success ? "#06d6a0" : "#e63946", marginBottom: 8 }}>
              {eventResult.success ? "SUCCESS!" : "SETBACK!"}
            </div>
            <div style={{ fontSize: 13, color: "#9ab0c6", lineHeight: 1.6, marginBottom: 12 }}>
              {eventResult.text}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: eventResult.spaces >= 0 ? "#06d6a0" : "#e63946", marginBottom: 12 }}>
              {eventResult.spaces >= 0 ? `+${eventResult.spaces}` : eventResult.spaces} tiles
            </div>
            {/* Re-roll option */}
            {canSpendHours && (
              <button onClick={onSpendHours} style={{
                ...secondaryBtn, marginBottom: 8, color: "#e9c46a", borderColor: "#e9c46a44",
              }}>
                ⏱️ Spend 3 hours to re-roll
              </button>
            )}
            <br />
            <button onClick={onDismiss} style={secondaryBtn}>Continue</button>
          </div>
        )}

        {/* Auto-resolve (insight/shortcut/setback/materiality) */}
        {eventPhase === "show" && currentEvent.advance != null && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: currentEvent.advance > 0 ? "#06d6a0" : "#e63946", marginBottom: 12 }}>
              {currentEvent.advance > 0 ? `+${currentEvent.advance}` : currentEvent.advance} tiles
            </div>
            <button onClick={onRollForEvent} style={secondaryBtn}>Continue</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Shared button style helpers
function choiceBtn(color) {
  return {
    flex: 1, padding: "12px 8px", fontSize: 12, fontWeight: 700,
    fontFamily: "'IBM Plex Mono', monospace",
    background: `${color}22`, color,
    border: `1px solid ${color}88`, borderRadius: 8, cursor: "pointer",
    lineHeight: 1.6, textAlign: "center",
  };
}

const primaryBtn = {
  padding: "10px 32px", fontSize: 13, fontWeight: 700,
  fontFamily: "'Orbitron', sans-serif",
  background: "linear-gradient(135deg, #e9c46a, #f4a261)",
  color: "#0a0e17", border: "none", borderRadius: 6, cursor: "pointer",
  letterSpacing: 1, textTransform: "uppercase",
};

const secondaryBtn = {
  padding: "8px 24px", fontSize: 12, fontWeight: 600,
  fontFamily: "'IBM Plex Mono', monospace",
  background: "#1e3a5f", color: "#e0e7ef",
  border: "1px solid #457b9d", borderRadius: 6, cursor: "pointer",
};

export { SAMPLING_OUTCOMES };
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EventModal.jsx
git commit -m "feat: add EventModal with Risk/Recon/Sampling player choice UI"
```

---

## Task 8: Build CardDrawModal component

**Files:**
- Create: `src/components/CardDrawModal.jsx`

- [ ] **Step 1: Create CardDrawModal.jsx**

```jsx
// src/components/CardDrawModal.jsx

const TYPE_COLORS = {
  good:    "#06d6a0",
  bad:     "#e63946",
  chaos:   "#a855f7",
  nuclear: "#ff0040",
};

const font = "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace";

export default function CardDrawModal({ card, onDismiss, playerName }) {
  if (!card) return null;

  const color = TYPE_COLORS[card.type] || "#e9c46a";

  // Build consequence string
  let tileText = "";
  if (card.tileDelta === "RETURN_TO_START") tileText = "⚠️ Return to Start";
  else if (card.tileDelta > 0) tileText = `+${card.tileDelta} tiles`;
  else if (card.tileDelta < 0) tileText = `${card.tileDelta} tiles`;
  else tileText = "No movement";

  let hoursText = "";
  if (card.hoursDelta === "LOSE_ALL") hoursText = "Lose ALL ⏱️";
  else if (card.hoursDelta > 0) hoursText = `+${card.hoursDelta} ⏱️`;
  else if (card.hoursDelta < 0) hoursText = `${card.hoursDelta} ⏱️`;

  const halfRollText = card.halfNextRoll ? "Next roll halved" : "";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
      padding: 16,
    }}
    onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <div style={{
        background: "linear-gradient(135deg, #1a2332, #111827)",
        border: `2px solid ${color}`,
        borderRadius: 16, padding: "32px 28px", maxWidth: 340, width: "100%",
        textAlign: "center",
        animation: "slideUp 0.3s ease",
        boxShadow: `0 0 40px ${color}44`,
      }}>
        {/* Card type label */}
        <div style={{
          fontSize: 9, letterSpacing: 2, color, textTransform: "uppercase",
          marginBottom: 12, opacity: 0.8,
        }}>
          📬 Inbox — {card.type.toUpperCase()}
        </div>

        {/* Emoji */}
        <div style={{ fontSize: 48, marginBottom: 12 }}>{card.emoji}</div>

        {/* Title */}
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e0e7ef", marginBottom: 10, lineHeight: 1.3 }}>
          {card.title}
        </div>

        {/* Flavor text */}
        <div style={{ fontSize: 11, color: "#9ab0c6", lineHeight: 1.7, marginBottom: 20 }}>
          {card.flavor}
        </div>

        {/* Consequences */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          {tileText && (
            <span style={{
              background: `${color}22`, border: `1px solid ${color}66`,
              borderRadius: 6, padding: "4px 10px", fontSize: 11,
              color, fontWeight: 700,
            }}>{tileText}</span>
          )}
          {hoursText && (
            <span style={{
              background: "#e9c46a22", border: "1px solid #e9c46a66",
              borderRadius: 6, padding: "4px 10px", fontSize: 11,
              color: "#e9c46a", fontWeight: 700,
            }}>{hoursText}</span>
          )}
          {halfRollText && (
            <span style={{
              background: "#f4a26122", border: "1px solid #f4a26166",
              borderRadius: 6, padding: "4px 10px", fontSize: 11,
              color: "#f4a261", fontWeight: 700,
            }}>{halfRollText}</span>
          )}
        </div>

        <button onClick={onDismiss} style={{
          padding: "10px 32px", fontSize: 12, fontWeight: 600,
          fontFamily: font,
          background: "#1e3a5f", color: "#e0e7ef",
          border: "1px solid #457b9d", borderRadius: 6, cursor: "pointer",
        }}>
          Accept fate
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CardDrawModal.jsx
git commit -m "feat: add CardDrawModal with meme-style Big 4 card design"
```

---

## Task 9: Rewrite App.jsx

**Files:**
- Modify: `src/App.jsx`

This is the largest task — it replaces the existing monolith with a thin orchestrator that delegates to the new components and uses gameLogic utilities.

- [ ] **Step 1: Replace App.jsx entirely**

```jsx
// src/App.jsx
import { useState, useCallback, useEffect, useRef } from "react";
import { BOARD_TILES, TILE_CONFIG, BOARD_SIZE, TILE_TYPES } from "./data/board";
import { EVENTS } from "./data/events";
import { PLAYERS, STARTING_HOURS, PROMOTION_ADVANCE, PROMOTION_HOURS_RESET,
         BURNOUT_ADVANCE, BURNOUT_HOURS_RESTORE, BOARD_FINISH } from "./data/players";
import { CARD_DECK } from "./data/cards";
import {
  rollDice, isDoubles, shuffleDeck, drawCard,
  resolveAIRollChoice, resolveAITileChoice,
  applyHoursDelta, checkPromotion, checkBurnout, checkClosingSprint,
} from "./utils/gameLogic";
import { SAMPLING_OUTCOMES } from "./components/EventModal";
import GameBoard from "./components/GameBoard";
import PlayerPanel from "./components/PlayerPanel";
import DiceControl from "./components/DiceControl";
import EventModal from "./components/EventModal";
import CardDrawModal from "./components/CardDrawModal";

const font = "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace";
const bg = "#0a0e17";
const panelBg = "#111827";
const borderColor = "#1e3a5f";

function getEvent(tileType) {
  const events = EVENTS[tileType];
  if (!events) return null;
  return events[Math.floor(Math.random() * events.length)];
}

function makePlayers() {
  return PLAYERS.map((p) => ({ ...p, position: 0, hours: STARTING_HOURS }));
}

export default function App() {
  const [gameState, setGameState] = useState("menu"); // menu | playing | event | card | gameover
  const [players, setPlayers] = useState(makePlayers());
  const [currentPlayer, setCurrentPlayer] = useState(0);

  // Dice
  const [diceValues, setDiceValues] = useState([1]);
  const [rolling, setRolling] = useState(false);
  const [pendingRollChoice, setPendingRollChoice] = useState(null); // "safe" | "risky" | null

  // Event modal
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventPhase, setEventPhase] = useState(null); // "show" | "choice" | "resolve"
  const [eventResult, setEventResult] = useState(null);
  const [eventChoice, setEventChoice] = useState(null); // stores "quick"/"deep"/"manual"/"automated"/90/95/99
  const [rerollUsed, setRerollUsed] = useState(false);

  // Card modal
  const [currentCard, setCurrentCard] = useState(null);
  const [cardDeck, setCardDeck] = useState(() => shuffleDeck(CARD_DECK));
  const [discardPile, setDiscardPile] = useState([]);

  // Board state
  const [trailHistory, setTrailHistory] = useState(PLAYERS.map(() => []));
  const [halfNextRoll, setHalfNextRoll] = useState(PLAYERS.map(() => false));
  const [closingSprintUsed, setClosingSprintUsed] = useState(false);
  const [closingSprintBonus, setClosingSprintBonus] = useState(null); // playerIdx | null

  // Meta
  const [winner, setWinner] = useState(null);
  const [log, setLog] = useState([]);
  const [gameSpeed, setGameSpeed] = useState("fast"); // "fast" | "normal"
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const addLog = useCallback((msg) => {
    setLog((prev) => [...prev.slice(-40), msg]);
  }, []);

  // --- Movement ---
  const movePlayer = useCallback((playerIdx, spaces, currentPlayers) => {
    const next = [...currentPlayers];
    let newPos = next[playerIdx].position + spaces;
    if (newPos < 0) newPos = 0;
    if (newPos >= BOARD_SIZE - 1) newPos = BOARD_SIZE - 1;
    next[playerIdx] = { ...next[playerIdx], position: newPos };
    return next;
  }, []);

  const updateTrail = useCallback((playerIdx, oldPos, currentTrails) => {
    const next = [...currentTrails];
    next[playerIdx] = [oldPos, ...next[playerIdx]].slice(0, 3);
    return next;
  }, []);

  // --- Hours management ---
  const applyHours = useCallback((playerIdx, delta, currentPlayers) => {
    const p = currentPlayers[playerIdx];
    const newHours = applyHoursDelta(p.hours, delta);
    const next = [...currentPlayers];
    next[playerIdx] = { ...next[playerIdx], hours: newHours };
    return next;
  }, []);

  // --- Win check ---
  const checkWin = useCallback((playerIdx, pos) => {
    return pos >= BOARD_FINISH;
  }, []);

  // --- Advance turn ---
  const advanceTurn = useCallback((fromPlayerIdx) => {
    const nextIdx = (fromPlayerIdx + 1) % PLAYERS.length;
    setCurrentPlayer(nextIdx);
    setPendingRollChoice(null);
    if (nextIdx !== 0) {
      // AI turn
      setTimeout(() => triggerAITurn(nextIdx), gameSpeed === "fast" ? 300 : 800);
    }
  }, [gameSpeed]); // eslint-disable-line

  // --- After event/card resolves, check hours triggers and advance turn ---
  const afterTurnEffects = useCallback((playerIdx, updatedPlayers, updatedTrails, updatedHalfRolls) => {
    let p = updatedPlayers[playerIdx];
    let finalPlayers = [...updatedPlayers];

    // Promotion check
    if (checkPromotion(p.hours)) {
      const oldPos = p.position;
      finalPlayers = movePlayer(playerIdx, PROMOTION_ADVANCE, finalPlayers);
      const updatedTrails2 = updateTrail(playerIdx, oldPos, updatedTrails);
      setTrailHistory(updatedTrails2);
      finalPlayers[playerIdx] = { ...finalPlayers[playerIdx], hours: PROMOTION_HOURS_RESET };
      addLog(`🎉 ${p.name} hit ${p.hours} hours — Early Promotion! +${PROMOTION_ADVANCE} tiles, hours reset to ${PROMOTION_HOURS_RESET}`);
      // Check win after promotion
      if (checkWin(playerIdx, finalPlayers[playerIdx].position)) {
        setPlayers(finalPlayers);
        setWinner(playerIdx);
        setGameState("gameover");
        return;
      }
    }

    // Burnout check
    if (checkBurnout(finalPlayers[playerIdx].hours)) {
      const oldPos = finalPlayers[playerIdx].position;
      finalPlayers = movePlayer(playerIdx, BURNOUT_ADVANCE, finalPlayers);
      const updatedTrails3 = updateTrail(playerIdx, oldPos, updatedTrails);
      setTrailHistory(updatedTrails3);
      finalPlayers[playerIdx] = { ...finalPlayers[playerIdx], hours: finalPlayers[playerIdx].hours + BURNOUT_HOURS_RESTORE };
      addLog(`💀 ${p.name} burned out! Back ${Math.abs(BURNOUT_ADVANCE)} tiles, +${BURNOUT_HOURS_RESTORE} ⏱️`);
    }

    setPlayers(finalPlayers);
    setHalfNextRoll(updatedHalfRolls);

    // Closing sprint check
    if (!closingSprintUsed) {
      const sprintIdx = checkClosingSprint(
        finalPlayers.map((pl) => ({ position: pl.position, hours: pl.hours })),
        closingSprintUsed
      );
      if (sprintIdx !== null) {
        setClosingSprintBonus(sprintIdx);
        setClosingSprintUsed(true);
        addLog(`🏁 ${finalPlayers[sprintIdx].name} qualifies for Closing Sprint bonus!`);
      }
    }

    setGameState("playing");
    advanceTurn(playerIdx);
  }, [movePlayer, updateTrail, checkWin, addLog, closingSprintUsed, advanceTurn]);

  // --- Handle roll execution ---
  const executeRoll = useCallback((playerIdx, rollChoice, currentPlayers, currentTrails, currentHalfRolls) => {
    setRolling(true);
    const diceCount = rollChoice === "risky" ? 2 : 1;
    let ticks = 0;
    const speed = gameSpeed === "fast" ? 60 : 80;

    const interval = setInterval(() => {
      setDiceValues(rollDice(diceCount));
      ticks++;
      const maxTicks = gameSpeed === "fast" ? 6 : 10;

      if (ticks >= maxTicks) {
        clearInterval(interval);
        const finalDice = rollDice(diceCount);
        setDiceValues(finalDice);
        setRolling(false);

        let totalMove = finalDice.reduce((a, b) => a + b, 0);

        // Doubles bonus on risky roll
        const doubles = rollChoice === "risky" && isDoubles(finalDice);
        if (doubles) {
          totalMove = totalMove * 2;
          addLog(`🎲 DOUBLES! ${currentPlayers[playerIdx].name} moves ${totalMove} tiles!`);
        }

        // LOOP card half-roll debuff
        const newHalfRolls = [...currentHalfRolls];
        if (newHalfRolls[playerIdx]) {
          totalMove = Math.floor(totalMove / 2);
          newHalfRolls[playerIdx] = false;
          addLog(`😩 LOOP debuff: ${currentPlayers[playerIdx].name}'s roll halved to ${totalMove}`);
        }

        // Closing sprint bonus
        let bonusRoll = 0;
        if (closingSprintBonus === playerIdx) {
          const [bonus] = rollDice(1);
          bonusRoll = bonus;
          setClosingSprintBonus(null);
          addLog(`🏁 Closing Sprint bonus: +${bonus} tiles!`);
        }

        totalMove += bonusRoll;

        const p = currentPlayers[playerIdx];
        addLog(`${p.icon} ${p.name} rolled ${finalDice.join("+")}${doubles ? " (doubles!)" : ""}${rollChoice === "risky" ? " [risky]" : ""} → moves ${totalMove}`);

        const oldPos = p.position;
        let newPos = oldPos + totalMove;
        if (newPos >= BOARD_SIZE - 1) newPos = BOARD_SIZE - 1;

        const updatedPlayers = [...currentPlayers];
        updatedPlayers[playerIdx] = { ...updatedPlayers[playerIdx], position: newPos };
        const updatedTrails = updateTrail(playerIdx, oldPos, currentTrails);
        setTrailHistory(updatedTrails);

        // Win?
        if (newPos >= BOARD_FINISH) {
          setPlayers(updatedPlayers);
          setWinner(playerIdx);
          setGameState("gameover");
          addLog(`🏆 ${p.name} reached Sign-Off! ENGAGEMENT COMPLETE!`);
          return;
        }

        setPlayers(updatedPlayers);

        // Tile event
        const tileType = BOARD_TILES[newPos];

        if (tileType === TILE_TYPES.INBOX) {
          // Draw a card
          const { card, remaining, newDiscard } = drawCard(cardDeck, discardPile);
          setCardDeck(remaining);
          if (card.nuclear) setDiscardPile([...newDiscard, card]);
          else setDiscardPile([...newDiscard, card]);
          if (card) {
            setTimeout(() => {
              setCurrentCard(card);
              setGameState("card");
            }, 300);
          } else {
            afterTurnEffects(playerIdx, updatedPlayers, updatedTrails, newHalfRolls);
          }
          return;
        }

        const event = getEvent(tileType);
        if (event) {
          const needsChoice = ["risk_choice", "recon_choice", "sampling_choice"].includes(event.type);
          setTimeout(() => {
            setCurrentEvent(event);
            setEventPhase(needsChoice ? "choice" : "show");
            setRerollUsed(false);
            setEventChoice(null);
            setGameState("event");
          }, 300);
        } else {
          addLog(`${p.icon} landed on ${TILE_CONFIG[tileType]?.label || "a tile"}`);
          afterTurnEffects(playerIdx, updatedPlayers, updatedTrails, newHalfRolls);
        }
      }
    }, speed);
  }, [gameSpeed, addLog, updateTrail, cardDeck, discardPile, closingSprintBonus, afterTurnEffects]);

  // --- Human roll ---
  const handleRollChoice = useCallback((choice) => {
    setPendingRollChoice(choice);
  }, []);

  const handleRoll = useCallback(() => {
    if (rolling || gameState !== "playing" || currentPlayer !== 0) return;
    executeRoll(0, pendingRollChoice, players, trailHistory, halfNextRoll);
    setPendingRollChoice(null);
  }, [rolling, gameState, currentPlayer, pendingRollChoice, players, trailHistory, halfNextRoll, executeRoll]);

  // --- AI turn ---
  const triggerAITurn = useCallback((playerIdx) => {
    if (gameState === "gameover") return;
    const p = players[playerIdx];
    const strategy = p.strategy;
    const humanPos = players[0].position;
    const rollChoice = resolveAIRollChoice(strategy, { position: p.position, humanPosition: humanPos });

    if (gameSpeed === "fast") {
      addLog(`${p.icon} ${p.name} — ${rollChoice} roll [${strategy}]`);
    }

    executeRoll(playerIdx, rollChoice, players, trailHistory, halfNextRoll);
  }, [gameState, players, trailHistory, halfNextRoll, gameSpeed, addLog, executeRoll]);

  // --- Event resolution ---
  const resolveEventWithChoice = useCallback((choice) => {
    setEventChoice(choice);
    setEventPhase("show");
  }, []);

  const handleRollForEvent = useCallback(() => {
    if (!currentEvent) return;
    const p = players[currentPlayer];

    if (currentEvent.advance != null) {
      // Auto-resolve (insight/shortcut/setback/materiality)
      const spaces = currentEvent.advance;
      setEventResult({ text: currentEvent.text, spaces, success: spaces > 0 });
      setEventPhase("resolve");
      setPlayers((prev) => {
        const next = movePlayer(currentPlayer, spaces, prev);
        return next;
      });
      addLog(`${p.icon} ${spaces > 0 ? "+" + spaces : spaces} tiles`);
      return;
    }

    if (currentEvent.type === "sampling_choice") {
      const conf = eventChoice;
      const outcome = SAMPLING_OUTCOMES[conf];
      if (outcome.guaranteed) {
        const { spaces } = outcome.guaranteed;
        setEventResult({ text: `${conf}% confidence — ${spaces > 0 ? "+" + spaces : spaces} tiles.`, spaces, success: true });
        setEventPhase("resolve");
        setPlayers((prev) => movePlayer(currentPlayer, spaces, prev));
        addLog(`${p.icon} ${conf}% sampling → +${spaces} tiles`);
        return;
      }
      const [roll] = rollDice(1);
      const { spaces, success } = outcome.roll(roll);
      setEventResult({ roll, text: `${conf}% confidence. Rolled ${roll} → ${spaces > 0 ? "+" + spaces : spaces} tiles.`, spaces, success });
      setEventPhase("resolve");
      setPlayers((prev) => movePlayer(currentPlayer, spaces, prev));
      addLog(`${p.icon} ${conf}% sampling, rolled ${roll} → ${spaces > 0 ? "+" + spaces : spaces} tiles`);
      return;
    }

    // risk_choice or recon_choice or dice or boss
    const [roll] = rollDice(1);
    let passThreshold, goodText, badText, stakes;

    if (currentEvent.type === "risk_choice") {
      passThreshold = eventChoice === "deep" ? 4 : 3;
      stakes = eventChoice === "deep" ? 4 : 2;
      goodText = eventChoice === "deep" ? currentEvent.deepGood : currentEvent.quickGood;
      badText = eventChoice === "deep" ? currentEvent.deepBad : currentEvent.quickBad;
    } else if (currentEvent.type === "recon_choice") {
      passThreshold = eventChoice === "automated" ? 4 : 3;
      stakes = eventChoice === "automated" ? 4 : 2;
      goodText = eventChoice === "automated" ? currentEvent.autoGood : currentEvent.manualGood;
      badText = eventChoice === "automated" ? currentEvent.autoBad : currentEvent.manualBad;
    } else if (currentEvent.type === "boss") {
      passThreshold = 4;
      goodText = currentEvent.pass;
      badText = currentEvent.fail;
    } else {
      // dice
      passThreshold = 3;
      goodText = currentEvent.good;
      badText = currentEvent.bad;
    }

    const success = roll >= passThreshold;
    const resultText = success ? goodText : badText;
    const match = resultText?.match(/(advance|go back|skip ahead|jump forward)\s+(\d+)/i);
    let spaces = 0;
    if (match) {
      spaces = parseInt(match[2]);
      if (/go back/i.test(match[1])) spaces = -spaces;
    }
    if (!spaces && stakes) spaces = success ? stakes : -stakes;

    setEventResult({ roll, success, text: resultText, spaces });
    setEventPhase("resolve");
    setPlayers((prev) => movePlayer(currentPlayer, spaces, prev));
    addLog(`${p.icon} rolled ${roll} — ${success ? "passed" : "failed"} → ${spaces > 0 ? "+" + spaces : spaces} tiles`);
  }, [currentEvent, eventChoice, currentPlayer, players, movePlayer, addLog]);

  const handleSpendHours = useCallback(() => {
    if (rerollUsed) return;
    setRerollUsed(true);
    setPlayers((prev) => {
      const next = [...prev];
      next[currentPlayer] = { ...next[currentPlayer], hours: Math.max(0, next[currentPlayer].hours - 3) };
      return next;
    });
    setEventResult(null);
    setEventPhase(currentEvent.type && ["risk_choice","recon_choice","sampling_choice"].includes(currentEvent.type) ? "choice" : "show");
    addLog(`${players[currentPlayer].icon} spent 3 ⏱️ to re-roll`);
  }, [rerollUsed, currentPlayer, players, currentEvent, addLog]);

  const handleDismissEvent = useCallback(() => {
    const updatedPlayers = [...players];
    const updatedHalfRolls = [...halfNextRoll];
    setCurrentEvent(null);
    setEventPhase(null);
    setEventResult(null);
    setEventChoice(null);
    afterTurnEffects(currentPlayer, updatedPlayers, trailHistory, updatedHalfRolls);
  }, [currentPlayer, players, trailHistory, halfNextRoll, afterTurnEffects]);

  // --- Card resolution ---
  const handleDismissCard = useCallback(() => {
    const card = currentCard;
    if (!card) return;

    let updatedPlayers = [...players];
    const p = updatedPlayers[currentPlayer];

    // Apply hours delta
    if (card.hoursDelta !== 0 || card.hoursDelta === "LOSE_ALL") {
      updatedPlayers = applyHours(currentPlayer, card.hoursDelta, updatedPlayers);
    }

    // Apply tile delta
    let updatedTrails = [...trailHistory];
    const oldPos = p.position;

    if (card.tileDelta === "RETURN_TO_START") {
      updatedPlayers[currentPlayer] = { ...updatedPlayers[currentPlayer], position: 0 };
      updatedTrails = updateTrail(currentPlayer, oldPos, updatedTrails);
      addLog(`☠️ ${p.name} sent back to Start!`);
    } else if (card.tileDelta !== 0) {
      updatedPlayers = movePlayer(currentPlayer, card.tileDelta, updatedPlayers);
      updatedTrails = updateTrail(currentPlayer, oldPos, updatedTrails);
    }

    // LOOP half-roll debuff
    const updatedHalfRolls = [...halfNextRoll];
    if (card.halfNextRoll) {
      updatedHalfRolls[currentPlayer] = true;
      addLog(`😩 ${p.name}'s next roll will be halved`);
    }

    addLog(`${p.icon} Drew: ${card.title}`);
    setCurrentCard(null);
    setGameState("playing");
    afterTurnEffects(currentPlayer, updatedPlayers, updatedTrails, updatedHalfRolls);
  }, [currentCard, currentPlayer, players, trailHistory, halfNextRoll, applyHours, movePlayer, updateTrail, addLog, afterTurnEffects]);

  // --- Game start ---
  const startGame = () => {
    setPlayers(makePlayers());
    setCurrentPlayer(0);
    setDiceValues([1]);
    setPendingRollChoice(null);
    setRolling(false);
    setCurrentEvent(null);
    setEventPhase(null);
    setEventResult(null);
    setEventChoice(null);
    setRerollUsed(false);
    setCurrentCard(null);
    setCardDeck(shuffleDeck(CARD_DECK));
    setDiscardPile([]);
    setTrailHistory(PLAYERS.map(() => []));
    setHalfNextRoll(PLAYERS.map(() => false));
    setClosingSprintUsed(false);
    setClosingSprintBonus(null);
    setWinner(null);
    setLog(["🏁 Engagement kicked off! Choose Safe or Risky roll to begin."]);
    setGameState("playing");
  };

  const rivalTurnMessage = currentPlayer !== 0 && gameState === "playing"
    ? `${players[currentPlayer]?.icon} ${players[currentPlayer]?.name} is thinking...`
    : null;

  // --- RENDER ---
  return (
    <div style={{
      fontFamily: font,
      background: `radial-gradient(ellipse at 30% 20%, #0d1b2a 0%, ${bg} 70%)`,
      color: "#e0e7ef", minHeight: "100vh", padding: "16px", boxSizing: "border-box",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Orbitron:wght@700;900&display=swap');
        @keyframes diceShake {
          0%   { transform: rotate(0deg) scale(1.1); }
          25%  { transform: rotate(-15deg) scale(1.15); }
          50%  { transform: rotate(15deg) scale(1.1); }
          75%  { transform: rotate(-10deg) scale(1.15); }
          100% { transform: rotate(0deg) scale(1.1); }
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes glowBorder { 0%,100% { box-shadow: 0 0 8px #06d6a044; } 50% { box-shadow: 0 0 20px #06d6a088; } }
      `}</style>

      {/* TITLE */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <h1 style={{
          fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(18px, 3.5vw, 28px)",
          fontWeight: 900, letterSpacing: 3, margin: 0,
          background: "linear-gradient(135deg, #06d6a0, #457b9d, #e9c46a)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textTransform: "uppercase",
        }}>
          Audit Analytics: The Board Game
        </h1>
        <div style={{ fontSize: 11, color: "#6b7f99", marginTop: 2, letterSpacing: 1 }}>
          Navigate from Kick-Off to Sign-Off — survive the engagement!
        </div>
      </div>

      {gameState === "menu" ? (
        /* MENU */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 40 }}>
          <div style={{ background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 12, padding: "32px 40px", maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <h2 style={{ fontFamily: "'Orbitron'", fontSize: 18, color: "#06d6a0", margin: "0 0 16px" }}>How to Play</h2>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: "#9ab0c6", textAlign: "left" }}>
              <p style={{ margin: "0 0 8px" }}>Race 40 tiles from <strong style={{ color: "#06d6a0" }}>Kick-Off</strong> to <strong style={{ color: "#ffd700" }}>Partner Sign-Off</strong> — against <strong style={{ color: "#86bc25" }}>Deloitted</strong>, <strong style={{ color: "#d9534f" }}>PwSee</strong>, <strong style={{ color: "#ffe600" }}>Ernst & Younger</strong>, and <strong style={{ color: "#0091da" }}>KPMZ</strong>.</p>
              <p style={{ margin: "0 0 8px" }}>Each turn: choose <strong>Safe Roll (1d6)</strong> or <strong>Risky Roll (2d6)</strong> — doubles on risky = move double!</p>
              <p style={{ margin: "0 0 8px" }}>Land on special tiles to make decisions. Earn <strong style={{ color: "#e9c46a" }}>⏱️ Billable Hours</strong> — hit 25 for an early promotion (+4 tiles), hit 0 for burnout (−4 tiles).</p>
              <p style={{ margin: 0 }}>📬 <strong>Inbox tiles</strong> draw from the <em>Busy Season Chronicles</em> deck. Pray it's not the PCAOB card.</p>
            </div>
            <button onClick={startGame} style={{
              marginTop: 24, padding: "14px 48px", fontSize: 15, fontWeight: 700,
              fontFamily: "'Orbitron'", background: "linear-gradient(135deg, #06d6a0, #2d6a4f)",
              color: "#0a0e17", border: "none", borderRadius: 8, cursor: "pointer",
              letterSpacing: 2, textTransform: "uppercase",
            }}
            onMouseOver={(e) => { e.target.style.transform = "scale(1.05)"; e.target.style.boxShadow = "0 0 24px #06d6a066"; }}
            onMouseOut={(e) => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "none"; }}
            >
              Start Engagement
            </button>
          </div>
        </div>
      ) : (
        /* GAME */
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <GameBoard
            players={players}
            currentPlayer={currentPlayer}
            gameState={gameState}
            trailHistory={trailHistory}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 270, minWidth: 240 }}>
            <PlayerPanel
              players={players}
              currentPlayer={currentPlayer}
              gameState={gameState}
              gameSpeed={gameSpeed}
              onToggleSpeed={() => setGameSpeed((s) => s === "fast" ? "normal" : "fast")}
            />

            <DiceControl
              diceValues={diceValues}
              rolling={rolling}
              gameState={gameState}
              currentPlayerIsHuman={currentPlayer === 0}
              pendingRollChoice={pendingRollChoice}
              onRollChoice={handleRollChoice}
              onRoll={handleRoll}
              rivalTurnMessage={rivalTurnMessage}
            />

            {/* Game over panel */}
            {gameState === "gameover" && (
              <div style={{ background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: winner === 0 ? "#06d6a0" : "#e63946", marginBottom: 8 }}>
                  {winner === 0 ? "🎉 Engagement Complete! You won!" : `${players[winner]?.icon} ${players[winner]?.name} beat you to Sign-Off!`}
                </div>
                <div style={{ fontSize: 11, color: "#6b7f99", marginBottom: 12 }}>
                  {players.map((p, i) => (
                    <div key={i} style={{ color: p.color }}>{p.icon} {p.name}: {p.hours} ⏱️</div>
                  ))}
                </div>
                <button onClick={startGame} style={{
                  padding: "8px 24px", fontSize: 12, fontWeight: 700, fontFamily: font,
                  background: "#1e3a5f", color: "#e0e7ef", border: "1px solid #457b9d",
                  borderRadius: 6, cursor: "pointer",
                }}>New Engagement</button>
              </div>
            )}

            {/* Tile Legend */}
            <div style={{ background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7f99", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Legend</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {Object.entries(TILE_CONFIG)
                  .filter(([k]) => k !== TILE_TYPES.NORMAL)
                  .map(([key, cfg]) => (
                    <div key={key} style={{
                      display: "flex", alignItems: "center", gap: 3,
                      fontSize: 9, color: cfg.color, padding: "2px 5px",
                      background: `${cfg.color}11`, borderRadius: 3,
                    }}>
                      <span style={{ fontSize: 12 }}>{cfg.emoji}</span>
                      {cfg.label}
                    </div>
                  ))}
              </div>
            </div>

            {/* Log */}
            <div ref={logRef} style={{
              background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10,
              padding: 10, maxHeight: 160, overflowY: "auto", flex: 1,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7f99", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                Engagement Log
              </div>
              {log.map((msg, i) => (
                <div key={i} style={{ fontSize: 10, color: "#9ab0c6", padding: "2px 0", borderBottom: "1px solid #1a2332", lineHeight: 1.5 }}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {gameState === "event" && currentEvent && (
        <EventModal
          currentEvent={currentEvent}
          eventPhase={eventPhase}
          eventResult={eventResult}
          currentPlayerIdx={currentPlayer}
          players={players}
          playerHours={players[currentPlayer]?.hours ?? 0}
          onRiskChoice={resolveEventWithChoice}
          onReconChoice={resolveEventWithChoice}
          onSamplingChoice={resolveEventWithChoice}
          onRollForEvent={handleRollForEvent}
          onDismiss={handleDismissEvent}
          onSpendHours={handleSpendHours}
          canSpendHours={!rerollUsed && (players[currentPlayer]?.hours ?? 0) >= 3}
        />
      )}

      {gameState === "card" && currentCard && (
        <CardDrawModal
          card={currentCard}
          onDismiss={handleDismissCard}
          playerName={players[currentPlayer]?.name}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run dev server and verify game loads**

```bash
npm run dev
```

Open `http://localhost:5173/board-game/`. Verify:
- Menu screen renders with 5 firm names visible
- Clicking "Start Engagement" loads the board
- No console errors

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: rewrite App.jsx as orchestrator using all new components"
```

---

## Task 10: Wire AI event resolution

The current `executeRoll` handles AI movement but AI players still need to auto-resolve tile choices (Risk/Recon/Sampling). Add AI choice auto-resolution inside the event flow for non-human players.

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add AI event auto-resolver in App.jsx**

In `App.jsx`, after the event is triggered in `executeRoll`, check if the current player is AI and auto-resolve their choice. Find this block in `executeRoll`:

```js
const event = getEvent(tileType);
if (event) {
  const needsChoice = ["risk_choice", "recon_choice", "sampling_choice"].includes(event.type);
  setTimeout(() => {
    setCurrentEvent(event);
    setEventPhase(needsChoice ? "choice" : "show");
    setRerollUsed(false);
    setEventChoice(null);
    setGameState("event");
  }, 300);
```

Replace it with:

```js
const event = getEvent(tileType);
if (event) {
  const needsChoice = ["risk_choice", "recon_choice", "sampling_choice"].includes(event.type);
  const isAI = !PLAYERS[playerIdx].isHuman;

  if (isAI && needsChoice) {
    // AI auto-picks choice based on strategy
    const strategy = PLAYERS[playerIdx].strategy;
    let choiceType = null;
    if (event.type === "risk_choice") choiceType = "risk";
    else if (event.type === "recon_choice") choiceType = "recon";
    else if (event.type === "sampling_choice") choiceType = "sampling";
    const aiChoice = resolveAITileChoice(strategy, choiceType);

    if (gameSpeed === "fast") {
      addLog(`${updatedPlayers[playerIdx].icon} ${updatedPlayers[playerIdx].name} chose ${aiChoice} [AI]`);
    }

    setTimeout(() => {
      setCurrentEvent(event);
      setEventPhase("show");
      setEventChoice(aiChoice);
      setRerollUsed(false);
      setGameState("event");
    }, gameSpeed === "fast" ? 100 : 400);
  } else {
    setTimeout(() => {
      setCurrentEvent(event);
      setEventPhase(needsChoice ? "choice" : "show");
      setRerollUsed(false);
      setEventChoice(null);
      setGameState("event");
    }, 300);
  }
```

- [ ] **Step 2: Test AI auto-resolution in browser**

Start a game. Let AI opponents take turns. Verify:
- In fast mode: AI choice appears in log, event modal opens at "show" phase (not "choice")
- In normal mode: event modal opens normally for human, auto-choices for AI

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: AI auto-resolves tile choices based on strategy"
```

---

## Task 11: Final verification pass

- [ ] **Step 1: Run tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 2: Build for production**

```bash
npm run build
```

Expected: Build succeeds, no errors. Warnings about bundle size are acceptable.

- [ ] **Step 3: Smoke test in browser — full game loop**

```bash
npm run dev
```

Play through a full game and verify:
- [ ] Menu shows 5 rival firm names
- [ ] Safe Roll shows 1 die; Risky Roll shows 2 dice; doubles moves double
- [ ] LOOP card halves next movement roll
- [ ] Inbox tile draws a card, card modal appears
- [ ] Nuclear card disappears from deck after firing
- [ ] Sampling tile shows 90/95/99% confidence choice with correct colors
- [ ] Risk tile shows Quick Review / Deep Dive choice
- [ ] Recon tile shows Manual / Automated choice
- [ ] Billable Hours display updates in PlayerPanel
- [ ] Early Promotion fires at 25 hours, resets to 12
- [ ] Burnout fires at 0 hours, goes back 4, restores 5 hours
- [ ] Token trail glow visible on last 3 tiles
- [ ] 5-player token stacking shows "+N" when >3 on same tile
- [ ] Fast/Normal speed toggle works
- [ ] Game over shows winner and final hours for all 5 players
- [ ] New Engagement resets everything

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete interactive gameplay overhaul — 5 players, choices, Billable Hours, card deck"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ 5 players (You + Deloitted, PwSee, Ernst & Younger, KPMZ) — Task 2, Task 9
- ✅ Safe (1d6) / Risky (2d6, doubles = 2× movement) — Task 3, Task 4, Task 9
- ✅ Sampling 90/95/99% confidence choice — Task 2, Task 7
- ✅ Risk tile: Quick Review / Deep Dive — Task 2, Task 7
- ✅ Recon tile: Manual / Automated — Task 2, Task 7
- ✅ Billable Hours currency (start 10, spend 3 to re-roll) — Task 3, Task 5, Task 9
- ✅ Early Promotion at 25 hours (+4 tiles, reset to 12) — Task 3, Task 9
- ✅ Burnout at 0 hours (−4 tiles, +5 hours restore) — Task 3, Task 9
- ✅ Closing Sprint (within 6 tiles + most hours → bonus roll) — Task 3, Task 9
- ✅ 15-card deck, Inbox tile, card modal — Task 2, Task 8, Task 9
- ✅ Nuclear card one-time removal — Task 3 (drawCard), Task 9
- ✅ LOOP card halves next roll — Task 2, Task 9
- ✅ Animated token trail (last 3 tiles, fading glow) — Task 6
- ✅ Token stacking (up to 3 + overflow) — Task 6
- ✅ 5-player compact PlayerPanel with hours bar — Task 5
- ✅ AI strategies per firm — Task 2, Task 3, Task 10
- ✅ Fast/Normal speed toggle — Task 5, Task 9
- ✅ Component split architecture — all tasks
