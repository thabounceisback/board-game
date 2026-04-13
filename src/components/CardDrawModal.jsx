// src/components/CardDrawModal.jsx
const TYPE_COLORS = {
  good:    "#06d6a0",
  bad:     "#e63946",
  chaos:   "#a855f7",
  nuclear: "#ff0040",
};

const font = "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace";

export default function CardDrawModal({ card, onDismiss }) {
  if (!card) return null;

  const color = TYPE_COLORS[card.type] || "#e9c46a";

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
        <div style={{ fontSize: 9, letterSpacing: 2, color, textTransform: "uppercase", marginBottom: 12, opacity: 0.8 }}>
          📬 Inbox — {card.type.toUpperCase()}
        </div>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{card.emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e0e7ef", marginBottom: 10, lineHeight: 1.3 }}>
          {card.title}
        </div>
        <div style={{ fontSize: 11, color: "#9ab0c6", lineHeight: 1.7, marginBottom: 20 }}>
          {card.flavor}
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          {tileText && (
            <span style={{ background: `${color}22`, border: `1px solid ${color}66`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color, fontWeight: 700 }}>
              {tileText}
            </span>
          )}
          {hoursText && (
            <span style={{ background: "#e9c46a22", border: "1px solid #e9c46a66", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#e9c46a", fontWeight: 700 }}>
              {hoursText}
            </span>
          )}
          {halfRollText && (
            <span style={{ background: "#f4a26122", border: "1px solid #f4a26166", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#f4a261", fontWeight: 700 }}>
              {halfRollText}
            </span>
          )}
        </div>
        <button onClick={onDismiss} style={{
          padding: "10px 32px", fontSize: 12, fontWeight: 600, fontFamily: font,
          background: "#1e3a5f", color: "#e0e7ef", border: "1px solid #457b9d",
          borderRadius: 6, cursor: "pointer",
        }}>
          Accept fate
        </button>
      </div>
    </div>
  );
}
