// src/utils/gameLogic.js
import {
  PROMOTION_THRESHOLD,
  BURNOUT_THRESHOLD,
  CLOSING_SPRINT_WINDOW,
  BOARD_FINISH,
} from "../data/players";

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
 * NOTE: The drawn card is NOT automatically added to newDiscard.
 * Callers must push card into their own discard pile after calling this.
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
  return { card, remaining: deck.slice(1), newDiscard: [...discard] };
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
 * Returns "quick"|"deep" for risk, "automated"|"manual" for recon, 90|95|99 for sampling.
 */
export function resolveAITileChoice(strategy, tileType) {
  if (strategy === "aggressive" || strategy === "overconfident") {
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
  return tileType === "sampling" ? 95 : "quick";
}

// --- Hours ---

/** Apply a delta to hours. delta may be a number or "LOSE_ALL". Returns new hours (floored at 0). */
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
      const othersWithSameHours = players.filter((other, idx) => idx !== i && other.hours === maxHours);
      if (othersWithSameHours.length === 0) return i;
      // Tiebreaker: furthest along board wins
      const tiedAndFurther = othersWithSameHours.some((other) => other.position >= p.position);
      if (!tiedAndFurther) return i;
    }
  }
  return null;
}
