# Audit Analytics: The Board Game — Interactive Gameplay Design

**Date:** 2026-04-13  
**Status:** Approved  
**Scope:** Add player choices, visual improvements, Billable Hours currency, card deck, and 5-player support to the existing React PWA board game.

---

## 1. Players

5 players total — 1 human, 4 AI rivals styled as Big 4 parody firms.

| Player | Name | Color | Icon | AI Strategy |
|---|---|---|---|---|
| Human | You | `#06d6a0` | 🧑‍💻 | Player-controlled |
| AI 1 | Deloitted | `#86bc25` | 🟢 | Always risky — 2d6, Deep Dive, 90% sample every turn |
| AI 2 | PwSee | `#d9534f` | 🔴 | Overconfident — risky when ≥5 tiles ahead of human, safe otherwise |
| AI 3 | Ernst & Younger | `#ffe600` | 🟡 | Chaotic — random choice each decision point |
| AI 4 | KPMZ | `#0091da` | 🔵 | Conservative — always Safe, Manual recon, 99% confidence |

AI decisions are resolved automatically using their strategy. In **Fast Mode** (default), each AI turn appears as a single log entry. In **Normal Mode**, full animations play.

---

## 2. Movement Dice Choice

Before every roll — human players choose, AI uses their strategy.

| Option | Roll | Special |
|---|---|---|
| **Safe Roll** | 1d6 (1–6) | No special rule |
| **Risky Roll** | 2d6 (2–12) | Rolling doubles = advance the sum **twice** (e.g., 4+4 = move 16). High variance, high ceiling. |

The risk of Risky Roll is not a penalty — it's landing further ahead on more dangerous tiles. Doubles are a bonus that can overshoot into bad tiles.

---

## 3. Tile Choice Mechanics

Three tile types now present the player with a decision before resolving.

### 🎯 Sampling — Confidence Level
| Choice | Sample | Outcome |
|---|---|---|
| 90% | n=25 | Roll d6: 1–3 = **−3 tiles**, 4–6 = **+5 tiles** |
| 95% | n=59 | Roll d6: 1–2 = **−1 tile**, 3–6 = **+3 tiles** |
| 99% | n=148 | **+2 tiles guaranteed**, no roll |

Color coding: 90% = red (risky), 95% = yellow (moderate), 99% = green (safe).

### ⚠️ Risk — Investigation Depth
| Choice | Pass Threshold | Stakes |
|---|---|---|
| Quick Review | Roll 3+ | ±2 tiles |
| Deep Dive | Roll 4+ | ±4 tiles |

### 📊 Recon — Tool Approach
| Choice | Pass Threshold | Stakes |
|---|---|---|
| Manual | Roll 3+ | ±2 tiles |
| Automated | Roll 4+ | ±4 tiles |

---

## 4. Billable Hours ⏱️ — Currency System

Every player starts with **10 ⏱️**. Shown in the player panel alongside tile position.

### Triggers

| Trigger | Condition | Effect |
|---|---|---|
| **Spend** | During any event | Pay 3 ⏱️ to re-roll one die. Once per event. Cannot go below 0. |
| **Early Promotion** 🎉 | Reach 25 ⏱️ | Advance 4 tiles immediately. Hours **reset to 12**. Can fire again if player rebuilds to 25. |
| **Burnout** 💀 | Drop to 0 ⏱️ | Go back 4 tiles. Receive 5 ⏱️ to continue. |
| **Closing Sprint** 🏁 | End-game only | See Section 5. |

Hours floor is 0. Hours have no ceiling beyond the Promotion trigger.

---

## 5. Win Condition & Closing Sprint

Standard win: first player to reach tile 39.

**Closing Sprint** — fires at most **once per game**:
- Condition: A player is within 6 tiles of the finish (tiles 33–38) **and** has strictly the most Billable Hours of all players.
- Tiebreaker: if hours are equal, the player furthest along the board wins the tiebreaker.
- Effect: That player gets **1 bonus roll** (1d6) on their next turn, added to their normal roll result.
- This is evaluated at the start of each turn for the qualifying player — first to qualify claims it.

---

## 6. Board Layout (40 Tiles)

| Type | Count | Notes |
|---|---|---|
| Start 🏁 | 1 | Tile 0 |
| Finish 🏆 | 1 | Tile 39 |
| Normal 📋 | 8 | No event |
| Inbox 📬 | 6 | Tiles ~5, 11, 17, 23, 29, 34 — draws a card |
| Risk ⚠️ | 4 | Now has Quick Review / Deep Dive choice |
| Recon 📊 | 3 | Now has Manual / Automated choice |
| Sampling 🎯 | 3 | Now has 90/95/99% confidence choice |
| Materiality 💰 | 2 | Auto-resolve (unchanged) |
| Data Quality 🔍 | 3 | Auto-resolve (unchanged) |
| Insight 💡 | 3 | Auto-advance bonus (unchanged) |
| Shortcut 🚀 | 2 | Auto-advance bonus (unchanged) |
| Setback 🐛 | 3 | Auto-setback (unchanged) |
| Boss 👔 | 1 | Tile 20 — Partner Review (unchanged) |
| **Total** | **39 tiles + tile 0** | = 40 |

---

## 7. Card Deck — "Busy Season Chronicles"

15 cards total. Shuffled at game start. Reshuffled immediately when exhausted. Landing on an **Inbox 📬** tile draws the top card.

The nuclear card ("Start the Engagement Over") is **removed from the deck after firing once** — it cannot appear twice in one game.

| # | Card | Effect | Hours |
|---|---|---|---|
| 1 | **"pls fix"** | Go back 2 | −2 ⏱️ |
| 2 | **SALY Approved** | Advance 2 | +3 ⏱️ |
| 3 | **"Just 3 More Entities"** | Go back 3 | −3 ⏱️ |
| 4 | **Wrong Year on the Memo** | Go back 1 | −1 ⏱️ |
| 5 | **Recon to TB Still Broken** | Go back 2 | −3 ⏱️ |
| 6 | **Last Year's Code Works As-Is** | Advance 3 | +2 ⏱️ |
| 7 | **LOOP Surveys Due** | Next movement roll halved (round down) | −2 ⏱️ |
| 8 | **Year-End Bonus** | Advance 2 | +5 ⏱️ |
| 9 | **Start the Engagement Over** ☠️ | Return to tile 0 | Lose ALL ⏱️ (one-time, then removed) |
| 10 | **Staff Forgot to Tick and Tie** | Go back 1 | −1 ⏱️ |
| 11 | **Partner's on the Golf Course** | All review deferred — advance 2 | +1 ⏱️ |
| 12 | **Charged to Wrong Code** | No movement | −3 ⏱️ |
| 13 | **Promoted to Manager** 🎉 | Advance 3 | +2 ⏱️ |
| 14 | **Busy Season: No PTO Approved** | No movement | −2 ⏱️ |
| 15 | **Senior Left the Firm** | Inherit workpapers — advance 2 | +1 ⏱️ |

Card modal design: dark card with colored border (green = good, red = bad, purple = neutral/chaos), large emoji, meme-style headline, flavor text, consequence badge.

---

## 8. Board Visual Changes

### Animated Token + Trail
- Player tokens are 28px icons that **CSS-transition smoothly** between tile positions on move.
- The **last 3 tiles** a player visited show a faint glow in that player's color, fading proportionally (tile −1 = 40% opacity, tile −2 = 20%, tile −3 = 8%).
- Active player's token pulses; all others are rendered at reduced opacity.

### 5-Player Token Stacking
- Up to 5 tokens can share a tile. Rendered as a horizontal row of small overlapping icons (max 3 visible + "+N" overflow badge if more).

### Player Panel Redesign
- Compact leaderboard rows (not large cards). Each row: icon, name, tile position, ⏱️ hours, mini progress bar.
- Active player row highlighted with color border + glow.
- All 5 rows visible simultaneously without scrolling.

---

## 9. Architecture

**Approach B** — split `App.jsx` into focused components. `App.jsx` remains the state orchestrator.

```
src/
  App.jsx                   # Game state (useState), turn logic, AI orchestration
  components/
    GameBoard.jsx            # Board rendering, tiles, tokens, trails
    PlayerPanel.jsx          # 5-player compact leaderboard
    DiceControl.jsx          # Safe/Risky choice + roll button + dice animation
    EventModal.jsx           # Tile events (Risk, Recon, Sampling, Boss, auto-resolve)
    CardDrawModal.jsx        # Inbox card reveal modal
  data/
    board.js                 # BOARD_TILES array, TILE_TYPES, TILE_CONFIG
    cards.js                 # 15-card deck definitions
    players.js               # Player configs + AI strategy definitions
    events.js                # Event pools per tile type
```

### State additions to App.jsx
- `billableHours: number[]` — per player
- `cardDeck: Card[]` — shuffled deck, mutable
- `discardPile: Card[]` — for tracking the nuclear card removal
- `trailHistory: number[][]` — last 3 positions per player
- `skipHalfRoll: boolean[]` — LOOP card flag per player
- `closingSprintUsed: boolean` — one-per-game flag
- `gameSpeed: 'fast' | 'normal'` — toggle in UI

---

## 10. Out of Scope

- Multiplayer over network (local single-device only)
- Sound effects
- Persistent leaderboard / save state
- Mobile layout changes (existing responsive design unchanged)
- New tile types beyond Inbox (Materiality, Data Quality remain auto-resolve)
