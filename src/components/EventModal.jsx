// src/components/EventModal.jsx
import { BOARD_TILES, TILE_CONFIG } from "../data/board";

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const font = "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace";

export const SAMPLING_OUTCOMES = {
  90: { label: "90% Confidence", color: "#e63946", n: "n=25", roll: (r) => r <= 3 ? { spaces: -3, success: false } : { spaces: 5, success: true } },
  95: { label: "95% Confidence", color: "#e9c46a", n: "n=59", roll: (r) => r <= 2 ? { spaces: -1, success: false } : { spaces: 3, success: true } },
  99: { label: "99% Confidence", color: "#06d6a0", n: "n=148", guaranteed: { spaces: 2, success: true } },
};

function choiceBtn(color) {
  return {
    flex: 1, padding: "12px 8px", fontSize: 12, fontWeight: 700,
    fontFamily: font,
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
  fontFamily: font,
  background: "#1e3a5f", color: "#e0e7ef",
  border: "1px solid #457b9d", borderRadius: 6, cursor: "pointer",
};

export default function EventModal({
  currentEvent,
  eventPhase,
  eventResult,
  currentPlayerIdx,
  players,
  playerHours,
  onRiskChoice,
  onReconChoice,
  onSamplingChoice,
  onRollForEvent,
  onDismiss,
  onSpendHours,
  canSpendHours,
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

        {eventPhase === "show" && (currentEvent.type === "dice" || currentEvent.type === "boss") && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#6b7f99", marginBottom: 8 }}>
              {currentEvent.type === "boss" ? "Roll 4+ to pass the partner review" : "Roll 3+ to succeed"}
            </div>
            <button onClick={onRollForEvent} style={primaryBtn}>Roll for it!</button>
          </div>
        )}

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
            {canSpendHours && (
              <div style={{ marginBottom: 8 }}>
                <button onClick={onSpendHours} style={{ ...secondaryBtn, color: "#e9c46a", borderColor: "#e9c46a44" }}>
                  ⏱️ Spend 3 hours to re-roll
                </button>
              </div>
            )}
            <button onClick={onDismiss} style={secondaryBtn}>Continue</button>
          </div>
        )}

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
