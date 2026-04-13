import { useState, useCallback, useEffect, useRef } from "react";

const BOARD_SIZE = 40;

const TILE_TYPES = {
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
};

const TILE_CONFIG = {
  [TILE_TYPES.START]: { emoji: "🏁", color: "#2d6a4f", label: "Start" },
  [TILE_TYPES.RISK]: { emoji: "⚠️", color: "#e63946", label: "Risk Event" },
  [TILE_TYPES.RECON]: { emoji: "📊", color: "#457b9d", label: "Recon Challenge" },
  [TILE_TYPES.SAMPLING]: { emoji: "🎯", color: "#e9c46a", label: "Sampling Test" },
  [TILE_TYPES.MATERIALITY]: { emoji: "💰", color: "#f4a261", label: "Materiality" },
  [TILE_TYPES.DATA_QUALITY]: { emoji: "🔍", color: "#264653", label: "Data Quality" },
  [TILE_TYPES.INSIGHT]: { emoji: "💡", color: "#06d6a0", label: "Insight Bonus" },
  [TILE_TYPES.SHORTCUT]: { emoji: "🚀", color: "#7209b7", label: "Automation" },
  [TILE_TYPES.SETBACK]: { emoji: "🐛", color: "#d62828", label: "Bug Found" },
  [TILE_TYPES.BOSS]: { emoji: "👔", color: "#1d3557", label: "Partner Review" },
  [TILE_TYPES.FINISH]: { emoji: "🏆", color: "#ffd700", label: "Sign-Off" },
  [TILE_TYPES.NORMAL]: { emoji: "📋", color: "#6c757d", label: "Workpaper" },
};

const BOARD_TILES = [
  TILE_TYPES.START,
  TILE_TYPES.NORMAL, TILE_TYPES.RISK, TILE_TYPES.NORMAL, TILE_TYPES.SAMPLING,
  TILE_TYPES.NORMAL, TILE_TYPES.INSIGHT, TILE_TYPES.NORMAL, TILE_TYPES.RECON, TILE_TYPES.NORMAL,
  TILE_TYPES.MATERIALITY, TILE_TYPES.NORMAL, TILE_TYPES.SHORTCUT, TILE_TYPES.NORMAL, TILE_TYPES.RISK,
  TILE_TYPES.NORMAL, TILE_TYPES.DATA_QUALITY, TILE_TYPES.NORMAL, TILE_TYPES.NORMAL, TILE_TYPES.SETBACK,
  TILE_TYPES.BOSS,
  TILE_TYPES.NORMAL, TILE_TYPES.INSIGHT, TILE_TYPES.NORMAL, TILE_TYPES.SAMPLING,
  TILE_TYPES.RISK, TILE_TYPES.NORMAL, TILE_TYPES.SHORTCUT, TILE_TYPES.NORMAL, TILE_TYPES.MATERIALITY,
  TILE_TYPES.NORMAL, TILE_TYPES.DATA_QUALITY, TILE_TYPES.NORMAL, TILE_TYPES.SETBACK, TILE_TYPES.NORMAL,
  TILE_TYPES.RECON, TILE_TYPES.NORMAL, TILE_TYPES.INSIGHT, TILE_TYPES.NORMAL,
  TILE_TYPES.FINISH,
];

const EVENTS = {
  [TILE_TYPES.RISK]: [
    { text: "Material misstatement detected in revenue! Roll for investigation depth.", type: "dice", good: "You traced it to a timing error — advance 2!", bad: "It's pervasive. Go back 3 while you expand testing." },
    { text: "Client changed ERP systems mid-year. How's your data extraction?", type: "dice", good: "Your CDM pipeline handles it smoothly — advance 2!", bad: "Schema mismatch breaks your notebook. Go back 2." },
    { text: "Unusual journal entry patterns flagged by risk scoring.", type: "dice", good: "False positive — your model is well-calibrated. Advance 1!", bad: "Fraudulent entries confirmed. Go back 3 for expanded procedures." },
    { text: "Related party transactions surfaced in GL analysis.", type: "dice", good: "Properly disclosed. Advance 2!", bad: "Undisclosed! Expand scope. Go back 3." },
  ],
  [TILE_TYPES.RECON]: [
    { text: "GL-to-TB reconciliation: Does your total match?", type: "dice", good: "Reconciled to the penny! Advance 3!", bad: "Off by $4.2M. Go back 2 to investigate." },
    { text: "Subledger-to-GL recon — can you tie it out?", type: "dice", good: "Perfect match across all entities! Advance 2!", bad: "Currency conversion gaps found. Go back 2." },
    { text: "Intercompany elimination check across entities.", type: "dice", good: "All eliminations balance! Advance 2!", bad: "Orphaned entries in Entity 3. Go back 1." },
  ],
  [TILE_TYPES.SAMPLING]: [
    { text: "Statistical sampling time! Pick your confidence level.", type: "dice", good: "Sample extrapolation within tolerable error! Advance 2!", bad: "Projected misstatement exceeds materiality. Go back 2 for expanded sample." },
    { text: "Non-statistical sampling of disbursements.", type: "dice", good: "No exceptions found! Advance 1!", bad: "3 exceptions in a sample of 25. Go back 2." },
  ],
  [TILE_TYPES.MATERIALITY]: [
    { text: "Planning materiality recalculation triggered!", type: "dice", good: "Materiality increased — fewer items to test! Advance 3!", bad: "Materiality decreased — more testing needed. Go back 1." },
    { text: "Performance materiality vs. overall materiality check.", type: "dice", good: "Well-calibrated ratio. Advance 1!", bad: "SAD exceeds PM. Expand procedures. Go back 2." },
  ],
  [TILE_TYPES.DATA_QUALITY]: [
    { text: "Data completeness check on GL extract.", type: "dice", good: "100% complete, all periods accounted for! Advance 2!", bad: "Missing 2 months of data. Go back 3 to re-extract." },
    { text: "Duplicate detection scan on journal entries.", type: "dice", good: "Clean data — no duplicates! Advance 1!", bad: "15,000 duplicate rows found. Go back 1 to clean." },
    { text: "Data type validation across all CDM fields.", type: "dice", good: "All fields conform to schema! Advance 2!", bad: "Date fields stored as strings. Go back 1 to fix pipeline." },
  ],
  [TILE_TYPES.INSIGHT]: [
    { text: "Your Claude API analysis surfaces a key finding!", advance: 3 },
    { text: "Automated trend analysis reveals a cost optimization. Client loves it!", advance: 2 },
    { text: "Your PySpark notebook runs 10x faster than last year's approach!", advance: 2 },
    { text: "Risk scoring model catches what manual review missed!", advance: 3 },
  ],
  [TILE_TYPES.SHORTCUT]: [
    { text: "You automated the entire procedure with pyod! Skip ahead!", advance: 4 },
    { text: "Databricks pipeline completes overnight. Jump forward!", advance: 3 },
    { text: "Reusable notebook from prior engagement saves days!", advance: 3 },
  ],
  [TILE_TYPES.SETBACK]: [
    { text: "Databricks cluster timed out during peak hours.", advance: -3 },
    { text: "Client sent wrong GL extract — back to data intake.", advance: -4 },
    { text: "Notebook code review found a PySpark anti-pattern.", advance: -2 },
    { text: "Excel output formatting broke for the 4th time.", advance: -2 },
  ],
  [TILE_TYPES.BOSS]: [
    { text: "PARTNER REVIEW: Present your findings to the engagement partner!", type: "boss", pass: "Partner signs off — outstanding work! Advance 4!", fail: "Partner has 12 review notes. Go back 3." },
  ],
};

const PLAYERS = [
  { name: "You", color: "#06d6a0", icon: "🧑‍💻" },
  { name: "Rival Firm", color: "#e63946", icon: "🏢" },
];

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

function getEvent(tileType) {
  const events = EVENTS[tileType];
  if (!events) return null;
  return events[Math.floor(Math.random() * events.length)];
}

// Board layout: snaking path
function getTilePosition(index, cols, tileSize, gap) {
  const row = Math.floor(index / cols);
  const colRaw = index % cols;
  const col = row % 2 === 0 ? colRaw : cols - 1 - colRaw;
  return {
    x: col * (tileSize + gap) + gap,
    y: row * (tileSize + gap) + gap,
  };
}

const DiceAnimation = ({ value, rolling }) => {
  const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  return (
    <div style={{
      fontSize: 64,
      lineHeight: 1,
      transition: "transform 0.2s",
      transform: rolling ? "rotate(360deg) scale(1.2)" : "rotate(0deg) scale(1)",
      animation: rolling ? "diceShake 0.15s infinite" : "none",
    }}>
      {faces[value - 1]}
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState("menu"); // menu, playing, event, gameover
  const [players, setPlayers] = useState(PLAYERS.map(p => ({ ...p, position: 0, score: 0 })));
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventPhase, setEventPhase] = useState(null); // "show", "resolve"
  const [eventResult, setEventResult] = useState(null);
  const [log, setLog] = useState([]);
  const [winner, setWinner] = useState(null);
  const logRef = useRef(null);

  const COLS = 8;
  const TILE_SIZE = 64;
  const GAP = 6;
  const BOARD_W = COLS * (TILE_SIZE + GAP) + GAP;
  const ROWS = Math.ceil(BOARD_SIZE / COLS);
  const BOARD_H = ROWS * (TILE_SIZE + GAP) + GAP;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const addLog = useCallback((msg) => {
    setLog(prev => [...prev.slice(-30), msg]);
  }, []);

  const movePlayer = useCallback((playerIdx, spaces) => {
    setPlayers(prev => {
      const next = [...prev];
      let newPos = next[playerIdx].position + spaces;
      if (newPos < 0) newPos = 0;
      if (newPos >= BOARD_SIZE - 1) newPos = BOARD_SIZE - 1;
      next[playerIdx] = { ...next[playerIdx], position: newPos };
      return next;
    });
  }, []);

  const handleRoll = useCallback(() => {
    if (rolling || gameState !== "playing") return;
    setRolling(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setDiceValue(rollDie());
      ticks++;
      if (ticks >= 10) {
        clearInterval(interval);
        const finalRoll = rollDie();
        setDiceValue(finalRoll);
        setRolling(false);

        const player = players[currentPlayer];
        addLog(`${player.icon} ${player.name} rolled a ${finalRoll}`);

        let newPos = player.position + finalRoll;
        if (newPos >= BOARD_SIZE - 1) {
          newPos = BOARD_SIZE - 1;
          setPlayers(prev => {
            const next = [...prev];
            next[currentPlayer] = { ...next[currentPlayer], position: newPos };
            return next;
          });
          setWinner(currentPlayer);
          setGameState("gameover");
          addLog(`🏆 ${player.name} reached Sign-Off! ENGAGEMENT COMPLETE!`);
          return;
        }

        setPlayers(prev => {
          const next = [...prev];
          next[currentPlayer] = { ...next[currentPlayer], position: newPos };
          return next;
        });

        const tileType = BOARD_TILES[newPos];
        const event = getEvent(tileType);

        if (event) {
          setTimeout(() => {
            setCurrentEvent(event);
            setEventPhase("show");
            setGameState("event");
          }, 400);
        } else {
          addLog(`${player.icon} landed on ${TILE_CONFIG[tileType]?.label || "a tile"}`);
          setTimeout(() => {
            if (currentPlayer === 0) {
              // AI turn
              setCurrentPlayer(1);
              setTimeout(() => autoRoll(1), 800);
            } else {
              setCurrentPlayer(0);
            }
          }, 300);
        }
      }
    }, 80);
  }, [rolling, gameState, players, currentPlayer, addLog]);

  const resolveEvent = useCallback((event, playerIdx) => {
    const player = players[playerIdx];
    if (event.type === "dice" || event.type === "boss") {
      const roll = rollDie();
      const success = event.type === "boss" ? roll >= 4 : roll >= 3;
      const resultText = success ? (event.good || event.pass) : (event.bad || event.fail);
      const match = resultText.match(/(advance|go back|skip ahead|jump forward)\s+(\d+)/i);
      let spaces = 0;
      if (match) {
        spaces = parseInt(match[2]);
        if (/go back/i.test(match[1])) spaces = -spaces;
      }
      setEventResult({ roll, success, text: resultText, spaces });
      movePlayer(playerIdx, spaces);
      addLog(`${player.icon} ${resultText}`);
    } else if (event.advance) {
      setEventResult({ text: event.text, spaces: event.advance, success: event.advance > 0 });
      movePlayer(playerIdx, event.advance);
      addLog(`${player.icon} ${event.advance > 0 ? "Advance" : "Go back"} ${Math.abs(event.advance)}!`);
    }
    setEventPhase("resolve");
  }, [players, movePlayer, addLog]);

  const dismissEvent = useCallback(() => {
    setCurrentEvent(null);
    setEventPhase(null);
    setEventResult(null);
    setGameState("playing");
    if (currentPlayer === 0) {
      setCurrentPlayer(1);
      setTimeout(() => autoRoll(1), 800);
    } else {
      setCurrentPlayer(0);
    }
  }, [currentPlayer]);

  const autoRoll = useCallback((playerIdx) => {
    if (gameState === "gameover") return;
    setRolling(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setDiceValue(rollDie());
      ticks++;
      if (ticks >= 8) {
        clearInterval(interval);
        const finalRoll = rollDie();
        setDiceValue(finalRoll);
        setRolling(false);

        const player = players[playerIdx] || PLAYERS[playerIdx];
        addLog(`${player.icon} ${player.name} rolled a ${finalRoll}`);

        setPlayers(prev => {
          const next = [...prev];
          let newPos = next[playerIdx].position + finalRoll;
          if (newPos >= BOARD_SIZE - 1) {
            newPos = BOARD_SIZE - 1;
            next[playerIdx] = { ...next[playerIdx], position: newPos };
            setTimeout(() => {
              setWinner(playerIdx);
              setGameState("gameover");
              addLog(`🏆 ${player.name} reached Sign-Off!`);
            }, 200);
            return next;
          }
          next[playerIdx] = { ...next[playerIdx], position: newPos };

          const tileType = BOARD_TILES[newPos];
          const event = getEvent(tileType);
          if (event) {
            setTimeout(() => {
              setCurrentEvent(event);
              setEventPhase("show");
              setGameState("event");
            }, 400);
          } else {
            addLog(`${player.icon} landed on ${TILE_CONFIG[tileType]?.label || "a tile"}`);
            setTimeout(() => setCurrentPlayer(0), 400);
          }
          return next;
        });
      }
    }, 80);
  }, [gameState, players, addLog]);

  const startGame = () => {
    setPlayers(PLAYERS.map(p => ({ ...p, position: 0, score: 0 })));
    setCurrentPlayer(0);
    setDiceValue(1);
    setLog(["🏁 Engagement kicked off! Roll to begin your analytics procedures."]);
    setWinner(null);
    setCurrentEvent(null);
    setEventPhase(null);
    setEventResult(null);
    setGameState("playing");
  };

  // --- RENDER ---
  const font = "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace";
  const bg = "#0a0e17";
  const panelBg = "#111827";
  const borderColor = "#1e3a5f";

  return (
    <div style={{
      fontFamily: font,
      background: `radial-gradient(ellipse at 30% 20%, #0d1b2a 0%, ${bg} 70%)`,
      color: "#e0e7ef",
      minHeight: "100vh",
      padding: "16px",
      boxSizing: "border-box",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=Orbitron:wght@700;900&display=swap');
        @keyframes diceShake {
          0% { transform: rotate(0deg) scale(1.1); }
          25% { transform: rotate(-15deg) scale(1.15); }
          50% { transform: rotate(15deg) scale(1.1); }
          75% { transform: rotate(-10deg) scale(1.15); }
          100% { transform: rotate(0deg) scale(1.1); }
        }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes glowBorder {
          0%,100% { box-shadow: 0 0 8px #06d6a044; }
          50% { box-shadow: 0 0 20px #06d6a088; }
        }
      `}</style>

      {/* TITLE */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <h1 style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "clamp(18px, 3.5vw, 28px)",
          fontWeight: 900,
          letterSpacing: 3,
          margin: 0,
          background: "linear-gradient(135deg, #06d6a0, #457b9d, #e9c46a)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textTransform: "uppercase",
        }}>
          Audit Analytics: The Board Game
        </h1>
        <div style={{ fontSize: 11, color: "#6b7f99", marginTop: 2, letterSpacing: 1 }}>
          Navigate from Kick-Off to Sign-Off — survive the engagement!
        </div>
      </div>

      {gameState === "menu" ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 24, marginTop: 40,
        }}>
          <div style={{
            background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 12,
            padding: "32px 40px", maxWidth: 440, textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <h2 style={{ fontFamily: "'Orbitron'", fontSize: 18, color: "#06d6a0", margin: "0 0 16px" }}>
              How to Play
            </h2>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: "#9ab0c6", textAlign: "left" }}>
              <p style={{ margin: "0 0 8px" }}>Roll the dice and navigate 40 tiles from <strong style={{ color: "#06d6a0" }}>Engagement Kick-Off</strong> to <strong style={{ color: "#ffd700" }}>Partner Sign-Off</strong>.</p>
              <p style={{ margin: "0 0 8px" }}>Land on special tiles to face audit challenges — risk events, reconciliation checks, sampling tests, data quality gates, and partner reviews.</p>
              <p style={{ margin: "0 0 8px" }}>Roll high to pass challenges and advance. Roll low and you'll face setbacks. Automation shortcuts and insight bonuses help you leap ahead!</p>
              <p style={{ margin: 0 }}>Race against the <strong style={{ color: "#e63946" }}>Rival Firm</strong> to complete the engagement first.</p>
            </div>
            <button onClick={startGame} style={{
              marginTop: 24, padding: "14px 48px", fontSize: 15, fontWeight: 700,
              fontFamily: "'Orbitron'", background: "linear-gradient(135deg, #06d6a0, #2d6a4f)",
              color: "#0a0e17", border: "none", borderRadius: 8, cursor: "pointer",
              letterSpacing: 2, textTransform: "uppercase",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseOver={e => { e.target.style.transform = "scale(1.05)"; e.target.style.boxShadow = "0 0 24px #06d6a066"; }}
            onMouseOut={e => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "none"; }}
            >
              Start Engagement
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {/* BOARD */}
          <div style={{
            background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10,
            padding: 10, position: "relative", flexShrink: 0,
            width: BOARD_W + 20, minHeight: BOARD_H + 20,
          }}>
            <div style={{ position: "relative", width: BOARD_W, height: BOARD_H }}>
              {BOARD_TILES.map((tileType, i) => {
                const pos = getTilePosition(i, COLS, TILE_SIZE, GAP);
                const cfg = TILE_CONFIG[tileType];
                const playersHere = players.filter(p => p.position === i);
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
                    transition: "all 0.3s",
                    boxShadow: playersHere.length > 0 ? `0 0 12px ${playersHere[0].color}88` : "none",
                  }}>
                    <span style={{ fontSize: 20, lineHeight: 1 }}>{cfg.emoji}</span>
                    <span style={{ fontSize: 8, marginTop: 2, opacity: 0.8, textAlign: "center", lineHeight: 1.1 }}>
                      {i === 0 ? "START" : i === BOARD_SIZE - 1 ? "FINISH" : cfg.label}
                    </span>
                    <span style={{ fontSize: 7, opacity: 0.4 }}>{i}</span>
                    {/* Player tokens */}
                    <div style={{ position: "absolute", bottom: -2, display: "flex", gap: 2 }}>
                      {playersHere.map((p, pi) => (
                        <span key={pi} style={{
                          fontSize: 16,
                          filter: "drop-shadow(0 0 4px " + p.color + ")",
                          animation: p.name === players[currentPlayer]?.name && gameState === "playing" ? "pulse 1s infinite" : "none",
                        }}>{p.icon}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDE PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 260, minWidth: 220 }}>
            {/* Players */}
            <div style={{
              background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 12,
            }}>
              {players.map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                  borderRadius: 6, marginBottom: i < players.length - 1 ? 6 : 0,
                  background: currentPlayer === i && gameState === "playing" ? `${p.color}18` : "transparent",
                  border: currentPlayer === i && gameState === "playing" ? `1px solid ${p.color}44` : "1px solid transparent",
                  animation: currentPlayer === i && gameState === "playing" ? "glowBorder 2s infinite" : "none",
                }}>
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "#6b7f99" }}>Tile {p.position} / {BOARD_SIZE - 1}</div>
                  </div>
                  <div style={{
                    width: 50, height: 6, background: "#1a2332", borderRadius: 3, overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${(p.position / (BOARD_SIZE - 1)) * 100}%`,
                      height: "100%", background: p.color, borderRadius: 3,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Dice + Controls */}
            <div style={{
              background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10,
              padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}>
              <DiceAnimation value={diceValue} rolling={rolling} />
              {gameState === "playing" && currentPlayer === 0 && (
                <button onClick={handleRoll} disabled={rolling} style={{
                  padding: "10px 32px", fontSize: 13, fontWeight: 700,
                  fontFamily: "'Orbitron'", letterSpacing: 1,
                  background: rolling ? "#333" : "linear-gradient(135deg, #06d6a0, #2d6a4f)",
                  color: rolling ? "#666" : "#0a0e17",
                  border: "none", borderRadius: 6, cursor: rolling ? "not-allowed" : "pointer",
                  textTransform: "uppercase", transition: "all 0.15s",
                }}
                onMouseOver={e => { if (!rolling) e.target.style.transform = "scale(1.05)"; }}
                onMouseOut={e => { e.target.style.transform = "scale(1)"; }}
                >
                  {rolling ? "Rolling..." : "Roll Dice"}
                </button>
              )}
              {gameState === "playing" && currentPlayer === 1 && (
                <div style={{ fontSize: 11, color: "#e63946", animation: "pulse 0.8s infinite" }}>
                  Rival Firm is rolling...
                </div>
              )}
              {gameState === "gameover" && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: winner === 0 ? "#06d6a0" : "#e63946", marginBottom: 8 }}>
                    {winner === 0 ? "You Won! Engagement Complete! 🎉" : "Rival Firm beat you to Sign-Off! 😤"}
                  </div>
                  <button onClick={startGame} style={{
                    padding: "8px 24px", fontSize: 12, fontWeight: 700, fontFamily: font,
                    background: "#1e3a5f", color: "#e0e7ef", border: "1px solid #457b9d",
                    borderRadius: 6, cursor: "pointer",
                  }}>
                    New Engagement
                  </button>
                </div>
              )}
            </div>

            {/* Tile Legend */}
            <div style={{
              background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: 10,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7f99", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Legend</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {Object.entries(TILE_CONFIG).filter(([k]) => k !== TILE_TYPES.NORMAL).map(([key, cfg]) => (
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
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7f99", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Engagement Log</div>
              {log.map((msg, i) => (
                <div key={i} style={{ fontSize: 10, color: "#9ab0c6", padding: "2px 0", borderBottom: "1px solid #1a2332", lineHeight: 1.5 }}>
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EVENT MODAL */}
      {gameState === "event" && currentEvent && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          padding: 16,
        }}
        onClick={e => { if (e.target === e.currentTarget && eventPhase === "resolve") dismissEvent(); }}
        >
          <div style={{
            background: "#111827", border: "1px solid #1e3a5f", borderRadius: 12,
            padding: "28px 32px", maxWidth: 400, width: "100%",
            animation: "slideUp 0.3s ease",
            boxShadow: "0 0 60px rgba(6, 214, 160, 0.15)",
          }}>
            {eventPhase === "show" && (
              <>
                <div style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>
                  {TILE_CONFIG[BOARD_TILES[players[currentPlayer].position]]?.emoji || "📋"}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e0e7ef", textAlign: "center", marginBottom: 6 }}>
                  {TILE_CONFIG[BOARD_TILES[players[currentPlayer].position]]?.label}
                </div>
                <div style={{ fontSize: 13, color: "#9ab0c6", textAlign: "center", marginBottom: 20, lineHeight: 1.6 }}>
                  {currentEvent.text}
                </div>
                {(currentEvent.type === "dice" || currentEvent.type === "boss") ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#6b7f99", marginBottom: 8 }}>
                      {currentEvent.type === "boss" ? "Roll 4+ to pass the review" : "Roll 3+ to succeed"}
                    </div>
                    <button onClick={() => resolveEvent(currentEvent, currentPlayer)} style={{
                      padding: "10px 32px", fontSize: 13, fontWeight: 700, fontFamily: "'Orbitron'",
                      background: "linear-gradient(135deg, #e9c46a, #f4a261)",
                      color: "#0a0e17", border: "none", borderRadius: 6, cursor: "pointer",
                      letterSpacing: 1, textTransform: "uppercase",
                    }}>
                      Roll for it!
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      fontSize: 24, fontWeight: 700,
                      color: currentEvent.advance > 0 ? "#06d6a0" : "#e63946",
                      marginBottom: 12,
                    }}>
                      {currentEvent.advance > 0 ? `+${currentEvent.advance} Tiles!` : `${currentEvent.advance} Tiles`}
                    </div>
                    <button onClick={() => { resolveEvent(currentEvent, currentPlayer); }} style={{
                      padding: "8px 28px", fontSize: 12, fontWeight: 600, fontFamily: font,
                      background: "#1e3a5f", color: "#e0e7ef", border: "1px solid #457b9d",
                      borderRadius: 6, cursor: "pointer",
                    }}>
                      Continue
                    </button>
                  </div>
                )}
              </>
            )}
            {eventPhase === "resolve" && eventResult && (
              <>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  {eventResult.roll && (
                    <div style={{ fontSize: 48, marginBottom: 8 }}>
                      {["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][eventResult.roll - 1]}
                    </div>
                  )}
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    color: eventResult.success ? "#06d6a0" : "#e63946",
                    marginBottom: 8,
                  }}>
                    {eventResult.success ? "SUCCESS!" : "SETBACK!"}
                  </div>
                  <div style={{ fontSize: 13, color: "#9ab0c6", lineHeight: 1.6, marginBottom: 16 }}>
                    {eventResult.text}
                  </div>
                  <div style={{
                    fontSize: 18, fontWeight: 700,
                    color: eventResult.spaces >= 0 ? "#06d6a0" : "#e63946",
                  }}>
                    {eventResult.spaces >= 0 ? `+${eventResult.spaces}` : eventResult.spaces} tiles
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <button onClick={dismissEvent} style={{
                    padding: "10px 32px", fontSize: 12, fontWeight: 600, fontFamily: font,
                    background: "#1e3a5f", color: "#e0e7ef", border: "1px solid #457b9d",
                    borderRadius: 6, cursor: "pointer",
                  }}>
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
