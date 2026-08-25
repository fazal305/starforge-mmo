export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 8;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Plain (non-React) camera model: world-space center + zoom. Deliberately
 * mutable and outside React state — panning/zooming happens every frame
 * via the renderer's rAF loop, and funnelling that through React state
 * would mean a re-render per mouse-move. React only reads a snapshot of
 * this (e.g. for a minimap) when it actually needs to.
 */
export class Camera {
  constructor({ x = 0, y = 0, zoom = 1 } = {}) {
    this.x = x;
    this.y = y;
    this.zoom = zoom;
  }

  panByScreenDelta(dx, dy) {
    this.x -= dx / this.zoom;
    this.y -= dy / this.zoom;
  }

  zoomAt(screenX, screenY, factor, viewportW, viewportH) {
    const before = this.screenToWorld(screenX, screenY, viewportW, viewportH);
    this.zoom = clamp(this.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const after = this.screenToWorld(screenX, screenY, viewportW, viewportH);
    this.x += before.x - after.x;
    this.y += before.y - after.y;
  }

  worldToScreen(wx, wy, viewportW, viewportH) {
    return {
      x: (wx - this.x) * this.zoom + viewportW / 2,
      y: (wy - this.y) * this.zoom + viewportH / 2,
    };
  }

  screenToWorld(sx, sy, viewportW, viewportH) {
    return {
      x: (sx - viewportW / 2) / this.zoom + this.x,
      y: (sy - viewportH / 2) / this.zoom + this.y,
    };
  }

  getVisibleWorldBounds(viewportW, viewportH, bufferScreenPx = 0) {
    const topLeft = this.screenToWorld(-bufferScreenPx, -bufferScreenPx, viewportW, viewportH);
    const bottomRight = this.screenToWorld(
      viewportW + bufferScreenPx,
      viewportH + bufferScreenPx,
      viewportW,
      viewportH,
    );
    return { minX: topLeft.x, minY: topLeft.y, maxX: bottomRight.x, maxY: bottomRight.y };
  }
}
