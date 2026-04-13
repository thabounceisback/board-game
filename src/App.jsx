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
  // Always holds the latest triggerAITurn — lets advanceTurn's setTimeout call it without a stale closure
  const triggerAITurnRef = useRef(null);

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
      // Use ref so the timer always calls the latest triggerAITurn (avoids stale closure)
      const delay = gameSpeed === "fast" ? 300 : 800;
      setTimeout(() => triggerAITurnRef.current?.(nextIdx), delay);
    }
  }, [gameSpeed]);

  // --- After event/card resolves, check hours triggers and advance turn ---
  const afterTurnEffects = useCallback((playerIdx, updatedPlayers, updatedTrails, updatedHalfRolls) => {
    let p = updatedPlayers[playerIdx];
    let finalPlayers = [...updatedPlayers];
    let latestTrails = updatedTrails; // chain trail updates to avoid losing intermediate entries

    // Promotion check
    if (checkPromotion(p.hours)) {
      const oldPos = p.position;
      finalPlayers = movePlayer(playerIdx, PROMOTION_ADVANCE, finalPlayers);
      latestTrails = updateTrail(playerIdx, oldPos, latestTrails);
      finalPlayers[playerIdx] = { ...finalPlayers[playerIdx], hours: PROMOTION_HOURS_RESET };
      addLog(`🎉 ${p.name} hit ${p.hours} hours — Early Promotion! +${PROMOTION_ADVANCE} tiles, hours reset to ${PROMOTION_HOURS_RESET}`);
      // Check win after promotion
      if (checkWin(playerIdx, finalPlayers[playerIdx].position)) {
        setTrailHistory(latestTrails);
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
      latestTrails = updateTrail(playerIdx, oldPos, latestTrails);
      finalPlayers[playerIdx] = { ...finalPlayers[playerIdx], hours: finalPlayers[playerIdx].hours + BURNOUT_HOURS_RESTORE };
      addLog(`💀 ${p.name} burned out! Back ${Math.abs(BURNOUT_ADVANCE)} tiles, +${BURNOUT_HOURS_RESTORE} ⏱️`);
    }

    setTrailHistory(latestTrails);
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
          if (!card) {
            // Deck and discard both empty — skip card draw
            afterTurnEffects(playerIdx, updatedPlayers, updatedTrails, newHalfRolls);
            return;
          }
          setCardDeck(remaining);
          // Nuclear cards are NOT added to discard — drawCard's reshuffle filter excludes nuclear
          // but keeping them out here makes the intent explicit and prevents any edge-case confusion
          if (!card.nuclear) setDiscardPile([...newDiscard, card]);
          setTimeout(() => {
            setCurrentCard(card);
            setGameState("card");
          }, 300);
          return;
        }

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
  // Keep ref in sync so advanceTurn's setTimeout always calls the latest version
  triggerAITurnRef.current = triggerAITurn;

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
      stakes = 4;
      goodText = currentEvent.pass;
      badText = currentEvent.fail;
    } else {
      // dice
      passThreshold = 3;
      stakes = 2;
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

    // Apply hours delta (skip cards with no hours effect; "LOSE_ALL" !== 0 so it passes through)
    if (card.hoursDelta !== 0) {
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
        />
      )}
    </div>
  );
}
