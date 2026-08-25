import { useEffect, useRef, useState } from "react";
import { UNIVERSE_SEED_DEFAULT } from "@starforge/shared";
import { Camera } from "../game/camera/Camera.js";
import { SectorCache } from "../game/world/sectorCache.js";
import { renderUniverse, pickSystemAtScreenPoint } from "../game/renderer/renderUniverse.js";
import { useUniverseStore } from "../stores/universeStore.js";

const DRAG_THRESHOLD_PX = 4;
const STATS_UPDATE_INTERVAL_MS = 500;

function readThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    background: style.getPropertyValue("--color-background").trim() || "#05070b",
    gridLine: style.getPropertyValue("--map-grid-line").trim() || "rgba(90,110,140,0.12)",
    textSecondary: style.getPropertyValue("--color-text-secondary").trim() || "#8a94a8",
    accent: style.getPropertyValue("--color-accent").trim() || "#4da8ff",
  };
}

export default function UniverseMap({ debugOverlayVisible }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(new Camera({ zoom: 0.35 }));
  const cacheRef = useRef(new SectorCache(UNIVERSE_SEED_DEFAULT));
  const colorsRef = useRef(readThemeColors());
  const pointerStateRef = useRef({ dragging: false, moved: false, lastX: 0, lastY: 0 });
  const [stats, setStats] = useState({ fps: 0, visibleSystems: 0, cachedSectors: 0 });

  const setSelectedSystem = useUniverseStore((s) => s.setSelectedSystem);
  const setHoveredSystem = useUniverseStore((s) => s.setHoveredSystem);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let rafId;
    let lastFrameTime = performance.now();
    let lastStatsUpdate = 0;
    let frameCount = 0;
    let fpsAccumulator = 0;

    const frame = (now) => {
      const dt = now - lastFrameTime;
      lastFrameTime = now;
      frameCount++;
      fpsAccumulator += dt;

      const camera = cameraRef.current;
      const bounds = camera.getVisibleWorldBounds(width, height, 64);
      const { sectors, systems } = cacheRef.current.getVisible(bounds);
      const { selectedSystemId, hoveredSystemId } = useUniverseStore.getState();

      renderUniverse(ctx, {
        camera,
        viewportW: width,
        viewportH: height,
        sectors,
        systems,
        selectedSystemId,
        hoveredSystemId,
        colors: colorsRef.current,
      });

      if (now - lastStatsUpdate > STATS_UPDATE_INTERVAL_MS) {
        setStats({
          fps: Math.round((1000 * frameCount) / Math.max(1, fpsAccumulator)),
          visibleSystems: systems.length,
          cachedSectors: cacheRef.current.totalCachedSectors,
        });
        lastStatsUpdate = now;
        frameCount = 0;
        fpsAccumulator = 0;
      }

      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    const handlePointerDown = (e) => {
      pointerStateRef.current = { dragging: true, moved: false, lastX: e.clientX, lastY: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const state = pointerStateRef.current;

      if (state.dragging) {
        const dx = e.clientX - state.lastX;
        const dy = e.clientY - state.lastY;
        if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD_PX) state.moved = true;
        cameraRef.current.panByScreenDelta(dx, dy);
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        return;
      }

      const bounds = cameraRef.current.getVisibleWorldBounds(width, height, 64);
      const { systems } = cacheRef.current.getVisible(bounds);
      const hit = pickSystemAtScreenPoint(cameraRef.current, width, height, systems, x, y);
      const current = useUniverseStore.getState().hoveredSystemId;
      const nextId = hit?.id ?? null;
      if (nextId !== current) setHoveredSystem(nextId);
    };

    const handlePointerUp = (e) => {
      const state = pointerStateRef.current;
      canvas.releasePointerCapture(e.pointerId);
      if (state.dragging && !state.moved) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const bounds = cameraRef.current.getVisibleWorldBounds(width, height, 64);
        const { systems } = cacheRef.current.getVisible(bounds);
        const hit = pickSystemAtScreenPoint(cameraRef.current, width, height, systems, x, y);
        setSelectedSystem(hit?.id ?? null);
      }
      pointerStateRef.current = { dragging: false, moved: false, lastX: 0, lastY: 0 };
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      cameraRef.current.zoomAt(x, y, factor, width, height);
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [setSelectedSystem, setHoveredSystem]);

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1, overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="Universe map — drag to pan, scroll to zoom, click a system to select it"
        style={{ display: "block", cursor: "grab", touchAction: "none" }}
      />
      {debugOverlayVisible && (
        <div
          style={{
            position: "absolute",
            top: "var(--space-3)",
            left: "var(--space-3)",
            padding: "var(--space-2) var(--space-3)",
            background: "var(--color-surface-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            pointerEvents: "none",
          }}
        >
          <div>FPS: {stats.fps}</div>
          <div>Visible systems: {stats.visibleSystems}</div>
          <div>Cached sectors: {stats.cachedSectors}</div>
        </div>
      )}
    </div>
  );
}
