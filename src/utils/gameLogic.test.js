import { describe, it, expect } from "vitest";
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
import { PROMOTION_THRESHOLD } from "../data/players";

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
    const originalIds = CARD_DECK.map((c) => c.id);
    shuffleDeck(CARD_DECK);
    expect(CARD_DECK.map((c) => c.id)).toEqual(originalIds);
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
  it("overconfident returns safe when exactly 4 ahead", () => {
    expect(resolveAIRollChoice("overconfident", { position: 19, humanPosition: 15 })).toBe("safe");
  });
});

describe("resolveAITileChoice", () => {
  it("aggressive picks deep/auto/90", () => {
    expect(resolveAITileChoice("aggressive", "risk")).toBe("deep");
    expect(resolveAITileChoice("aggressive", "recon")).toBe("auto");
    expect(resolveAITileChoice("aggressive", "sampling")).toBe(90);
  });
  it("conservative picks quick/manual/99", () => {
    expect(resolveAITileChoice("conservative", "risk")).toBe("quick");
    expect(resolveAITileChoice("conservative", "recon")).toBe("manual");
    expect(resolveAITileChoice("conservative", "sampling")).toBe(99);
  });
  it("overconfident picks same as aggressive (deep/auto/90)", () => {
    expect(resolveAITileChoice("overconfident", "risk")).toBe("deep");
    expect(resolveAITileChoice("overconfident", "recon")).toBe("auto");
    expect(resolveAITileChoice("overconfident", "sampling")).toBe(90);
  });
  it("chaotic returns a valid choice for each tile type", () => {
    const riskChoices = new Set();
    const reconChoices = new Set();
    const samplingChoices = new Set();
    for (let i = 0; i < 50; i++) {
      riskChoices.add(resolveAITileChoice("chaotic", "risk"));
      reconChoices.add(resolveAITileChoice("chaotic", "recon"));
      samplingChoices.add(resolveAITileChoice("chaotic", "sampling"));
    }
    expect([...riskChoices].every((c) => ["quick", "deep"].includes(c))).toBe(true);
    expect([...reconChoices].every((c) => ["manual", "auto"].includes(c))).toBe(true);
    expect([...samplingChoices].every((c) => [90, 95, 99].includes(c))).toBe(true);
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
  it("returns the further-ahead player when two players tie on hours within window", () => {
    const players = [
      { position: 33, hours: 20 },
      { position: 35, hours: 20 },
    ];
    expect(checkClosingSprint(players, false)).toBe(1);
  });
});
