// src/components/GameBoard.jsx
import { BOARD_TILES, TILE_CONFIG, BOARD_SIZE } from "../data/board";

const COLS = 8;
const TILE_SIZE = 64;
const GAP = 6;
export const BOARD_W = COLS * (TILE_SIZE + GAP) + GAP;
const ROWS = Math.ceil(BOARD_SIZE / COLS);
export const BOARD_H = ROWS * (TILE_SIZE + GAP) + GAP;

function getTilePosition(index) {
  const row = Math.floor(index / COLS);
  const colRaw = index % COLS;
  const col = row % 2 === 0 ? colRaw : COLS - 1 - colRaw;
  return {
    x: col * (TILE_SIZE + GAP) + GAP,
    y: row * (TILE_SIZE + GAP) + GAP,
  };
}

function getTrailOpacity(depth) {
  if (depth === 1) return 0.4;
  if (depth === 2) return 0.2;
  return 0.08;
}

export default function GameBoard({ players, currentPlayer, gameState, trailHistory }) {
  const panelBg = "#111827";
  const borderColor = "#1e3a5f";

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

          const strongestTrail = trails.reduce((best, t) =>
            !best || t.depth < best.depth ? t : best, null);

          const trailOpacityHex = strongestTrail
            ? Math.round(getTrailOpacity(strongestTrail.depth) * 255).toString(16).padStart(2, "0")
            : "00";

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
                  ? `0 0 8px ${players[strongestTrail.playerIdx].color}${trailOpacityHex}`
                  : "none",
            }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{cfg.emoji}</span>
              <span style={{ fontSize: 8, marginTop: 2, opacity: 0.8, textAlign: "center", lineHeight: 1.1 }}>
                {i === 0 ? "START" : i === BOARD_SIZE - 1 ? "FINISH" : cfg.label}
              </span>
              <span style={{ fontSize: 7, opacity: 0.4 }}>{i}</span>

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
