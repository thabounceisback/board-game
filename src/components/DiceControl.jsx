// src/components/DiceControl.jsx
const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const font = "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace";

export default function DiceControl({
  diceValues,
  rolling,
  gameState,
  currentPlayerIsHuman,
  onRollChoice,
  pendingRollChoice,
  onRoll,
  rivalTurnMessage,
}) {
  const panelBg = "#111827";
  const borderColor = "#1e3a5f";

  return (
    <div style={{
      background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 10,
      padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    }}>
      <div style={{ display: "flex", gap: 8 }}>
        {diceValues.map((val, i) => (
          <div key={i} style={{
            fontSize: 56, lineHeight: 1,
            transition: "transform 0.2s",
            transform: rolling ? "rotate(360deg) scale(1.2)" : "scale(1)",
            animation: rolling ? "diceShake 0.15s infinite" : "none",
          }}>
            {DICE_FACES[val - 1]}
          </div>
        ))}
      </div>

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

      {rolling && (
        <div style={{ fontSize: 11, color: "#e9c46a", animation: "pulse 0.8s infinite" }}>
          Rolling...
        </div>
      )}

      {gameState === "playing" && !currentPlayerIsHuman && rivalTurnMessage && !rolling && (
        <div style={{ fontSize: 11, color: "#6b7f99", animation: "pulse 0.8s infinite", textAlign: "center" }}>
          {rivalTurnMessage}
        </div>
      )}
    </div>
  );
}
