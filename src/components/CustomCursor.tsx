"use client";

import { useEffect, useRef, useState } from "react";

const CHASE = 0.35;
const ANGLE_CHASE = 0.3;
const LENGTH = 15;
const WIDTH = 9;

/** The whole cursor is a single triangle — no separate pivot dot plus a
 * line/rectangle tail. The triangle itself lags a step behind the real
 * pointer position (that lag is the "tail follows" effect) and its
 * rotation eases toward the direction of travel via shortest-path angle
 * lerp, which is what makes it wiggle on quick turns instead of snapping.
 * Filled white with mix-blend-mode: difference, so it inverts whatever
 * color it's over instead of sitting flatly on top of it.
 *
 * Desktop only (pointer: fine) and skipped under prefers-reduced-motion.
 * Text inputs keep the normal cursor (see .custom-cursor-active in
 * globals.css) so the app's many forms stay usable. */
export function CustomCursor() {
  const triangleRef = useRef<SVGPolygonElement>(null);
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
      <polygon
        ref={triangleRef}
        points={`${LENGTH * 0.65},0 ${-LENGTH * 0.35},${WIDTH / 2} ${-LENGTH * 0.35},${-WIDTH / 2}`}
        fill="white"
      />
    </svg>
  );
}
