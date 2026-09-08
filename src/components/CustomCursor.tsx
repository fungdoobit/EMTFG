"use client";

import { useEffect, useRef, useState } from "react";

const CHASE = 0.35;
const ANGLE_CHASE = 0.3;
const LENGTH = 26;
const WIDTH = 20;
const CORNER_RADIUS = 3;

type Point = { x: number; y: number };

/** Builds a closed path that traces the given polygon but replaces each
 * sharp vertex with a short quadratic curve, i.e. a rounded-corner
 * version of the polygon — SVG has no border-radius equivalent for
 * <polygon>, so this is what rounding an arbitrary (including concave)
 * shape actually takes. */
function roundedPolygonPath(points: Point[], radius: number): string {
  const n = points.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const curr = points[i];
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];

    const towardPrev = { x: prev.x - curr.x, y: prev.y - curr.y };
    const towardNext = { x: next.x - curr.x, y: next.y - curr.y };
    const prevLen = Math.hypot(towardPrev.x, towardPrev.y);
    const nextLen = Math.hypot(towardNext.x, towardNext.y);
    const rPrev = Math.min(radius, prevLen / 2);
    const rNext = Math.min(radius, nextLen / 2);

    const enter = {
      x: curr.x + (towardPrev.x / prevLen) * rPrev,
      y: curr.y + (towardPrev.y / prevLen) * rPrev,
    };
    const exit = {
      x: curr.x + (towardNext.x / nextLen) * rNext,
      y: curr.y + (towardNext.y / nextLen) * rNext,
    };

    d += i === 0 ? `M ${enter.x} ${enter.y} ` : `L ${enter.x} ${enter.y} `;
    d += `Q ${curr.x} ${curr.y} ${exit.x} ${exit.y} `;
  }
  return d + "Z";
}

const ARROWHEAD_PATH = roundedPolygonPath(
  [
    { x: LENGTH * 0.65, y: 0 },
    { x: -LENGTH * 0.35, y: WIDTH / 2 },
    { x: -LENGTH * 0.05, y: 0 },
    { x: -LENGTH * 0.35, y: -WIDTH / 2 },
  ],
  CORNER_RADIUS
);

/** The whole cursor is a single arrowhead — a triangle with a concave notch
 * cut into its back edge and its corners rounded off, not a plain sharp
 * triangle, and not a separate pivot dot plus a line/rectangle tail. It
 * lags a step behind the real pointer
 * position (that lag is the "tail follows" effect) and its
 * rotation eases toward the direction of travel via shortest-path angle
 * lerp, which is what makes it wiggle on quick turns instead of snapping.
 * Filled white with mix-blend-mode: difference, so it inverts whatever
 * color it's over instead of sitting flatly on top of it.
 *
 * Desktop only (pointer: fine) and skipped under prefers-reduced-motion.
 * Text inputs keep the normal cursor (see .custom-cursor-active in
 * globals.css) so the app's many forms stay usable. */
export function CustomCursor() {
  const triangleRef = useRef<SVGPathElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFinePointer || prefersReducedMotion) return;

    // Capability check (matchMedia) only exists client-side, so this can't
    // be a lazy useState initializer — it has to run after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(true);
    document.documentElement.classList.add("custom-cursor-active");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let x = mouseX;
    let y = mouseY;
    let angle = 0;

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    function tick() {
      const prevX = x;
      const prevY = y;
      x += (mouseX - x) * CHASE;
      y += (mouseY - y) * CHASE;

      const dx = x - prevX;
      const dy = y - prevY;
      if (Math.hypot(dx, dy) > 0.2) {
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        let delta = targetAngle - angle;
        delta = ((delta + 180) % 360 + 360) % 360 - 180;
        angle += delta * ANGLE_CHASE;
      }

      triangleRef.current?.setAttribute("transform", `translate(${x} ${y}) rotate(${angle})`);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, []);

  if (!enabled) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] h-full w-full mix-blend-difference"
    >
      <path ref={triangleRef} d={ARROWHEAD_PATH} fill="white" />
    </svg>
  );
}
