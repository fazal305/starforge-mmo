import { SECTOR_SIZE } from "@starforge/game-engine";

const STAR_COLORS = {
  blue: "#7fb8ff",
  white: "#eef2f8",
  yellow: "#ffd873",
  orange: "#ff9d52",
  red: "#ff6b5e",
  neutron: "#c98bff",
};

const MIN_ZOOM_FOR_GRID = 0.15;
const MIN_ZOOM_FOR_PLANET_DOTS = 0.6;

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {{
 *   camera: import("../camera/Camera.js").Camera,
 *   viewportW: number,
 *   viewportH: number,
 *   sectors: object[],
 *   systems: object[],
 *   selectedSystemId: string | null,
 *   hoveredSystemId: string | null,
 *   fleets?: { id: string, status: string, renderPosition: { x: number, y: number }, selected: boolean }[],
 *   colors: { background: string, gridLine: string, textSecondary: string, accent: string },
 * }} params
 */
export function renderUniverse(ctx, params) {
  const { camera, viewportW, viewportH, sectors, systems, selectedSystemId, hoveredSystemId, fleets, colors } = params;

  ctx.save();
  ctx.clearRect(0, 0, viewportW, viewportH);
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, viewportW, viewportH);

  if (camera.zoom >= MIN_ZOOM_FOR_GRID) {
    drawSectorGrid(ctx, camera, viewportW, viewportH, sectors, colors.gridLine);
  }

  for (const system of systems) {
    drawSystem(ctx, camera, viewportW, viewportH, system, {
      selected: system.id === selectedSystemId,
      hovered: system.id === hoveredSystemId,
      colors,
    });
  }

  for (const fleet of fleets ?? []) {
    drawFleet(ctx, camera, viewportW, viewportH, fleet, colors);
  }

  ctx.restore();
}

function drawFleet(ctx, camera, viewportW, viewportH, fleet, colors) {
  const pos = camera.worldToScreen(fleet.renderPosition.x, fleet.renderPosition.y, viewportW, viewportH);
  const size = Math.max(3, 4 * Math.sqrt(camera.zoom));

  ctx.save();
  ctx.translate(pos.x, pos.y);
  if (fleet.status === "MOVING" && fleet.heading !== undefined) {
    ctx.rotate(fleet.heading);
  }
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.7, size * 0.7);
  ctx.lineTo(-size * 0.7, size * 0.7);
  ctx.closePath();
  ctx.fillStyle = fleet.selected ? colors.accent : "#d7dce6";
  ctx.fill();
  if (fleet.selected) {
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawSectorGrid(ctx, camera, viewportW, viewportH, sectors, gridLineColor) {
  ctx.strokeStyle = gridLineColor;
  ctx.lineWidth = 1;
  for (const sector of sectors) {
    const topLeft = camera.worldToScreen(sector.gx * SECTOR_SIZE, sector.gy * SECTOR_SIZE, viewportW, viewportH);
    const size = SECTOR_SIZE * camera.zoom;
    ctx.strokeRect(topLeft.x, topLeft.y, size, size);

    if (sector.hasNebula) {
      ctx.fillStyle = "rgba(140, 110, 200, 0.04)";
      ctx.fillRect(topLeft.x, topLeft.y, size, size);
    }
  }
}

function drawSystem(ctx, camera, viewportW, viewportH, system, { selected, hovered, colors }) {
  const pos = camera.worldToScreen(system.x, system.y, viewportW, viewportH);
  const radius = Math.max(1.5, 2.2 * Math.sqrt(camera.zoom));

  if (selected || hovered) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = selected ? colors.accent : colors.textSecondary;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = STAR_COLORS[system.starType] ?? STAR_COLORS.white;
  ctx.fill();

  if (camera.zoom >= MIN_ZOOM_FOR_PLANET_DOTS && system.planets.length > 0) {
    const orbitRadius = radius + 6;
    ctx.strokeStyle = "rgba(140, 155, 180, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, orbitRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Hit-tests a screen point against visible systems, returns the nearest within tolerance or null. */
export function pickSystemAtScreenPoint(camera, viewportW, viewportH, systems, screenX, screenY, toleranceScreenPx = 8) {
  let closest = null;
  let closestDistSq = Infinity;
  for (const system of systems) {
    const pos = camera.worldToScreen(system.x, system.y, viewportW, viewportH);
    const dx = pos.x - screenX;
    const dy = pos.y - screenY;
    const distSq = dx * dx + dy * dy;
    if (distSq <= toleranceScreenPx * toleranceScreenPx && distSq < closestDistSq) {
      closest = system;
      closestDistSq = distSq;
    }
  }
  return closest;
}
