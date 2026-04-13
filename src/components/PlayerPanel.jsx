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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <div style={{ flex: 1, height: 4, background: "#1a2332", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%", background: p.color, borderRadius: 2, transition: "width 0.5s ease" }} />
                </div>
                <span style={{ fontSize: 8, color: "#6b7f99", flexShrink: 0 }}>{p.position}/{BOARD_FINISH}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                <div style={{ flex: 1, height: 3, background: "#1a2332", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${hoursProgress}%`, height: "100%", background: "#e9c46a", borderRadius: 2, transition: "width 0.4s ease" }} />
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
