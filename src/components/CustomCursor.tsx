"use client";

import { useEffect, useRef, useState } from "react";

const CHAIN_LENGTH = 7;
const PIVOT_CHASE = 0.45;
const LINK_CHASE = 0.4;
const HEAD_SIZE = 7;

/** A pointed head sits exactly at the pivot (the real pointer position) and
 * a short chain of links trails behind it, each one chasing the link ahead
 * with the same lerp factor — that cascade is what makes the tail flow and
 * wiggle on quick or curved moves instead of just dragging in a straight
 * line. The whole thing is drawn in white with mix-blend-mode: difference,
 * so it inverts whatever color it's over rather than sitting on top of it.
 *
 * Desktop only (pointer: fine) and skipped under prefers-reduced-motion.
 * Text inputs keep the normal cursor (see .custom-cursor-active in
 * globals.css) so the app's many forms stay usable. */
export function CustomCursor() {
  const pathRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGPolygonElement>(null);
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
    const chain = Array.from({ length: CHAIN_LENGTH }, () => ({ x: mouseX, y: mouseY }));

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    function tick() {
      chain[0].x += (mouseX - chain[0].x) * PIVOT_CHASE;
      chain[0].y += (mouseY - chain[0].y) * PIVOT_CHASE;
      for (let i = 1; i < chain.length; i++) {
        chain[i].x += (chain[i - 1].x - chain[i].x) * LINK_CHASE;
        chain[i].y += (chain[i - 1].y - chain[i].y) * LINK_CHASE;
      }

      let d = `M ${chain[0].x} ${chain[0].y}`;
      for (let i = 1; i < chain.length - 1; i++) {
        const midX = (chain[i].x + chain[i + 1].x) / 2;
        const midY = (chain[i].y + chain[i + 1].y) / 2;
        d += ` Q ${chain[i].x} ${chain[i].y} ${midX} ${midY}`;
      }
      pathRef.current?.setAttribute("d", d);

      const dx = chain[0].x - chain[1].x;
      const dy = chain[0].y - chain[1].y;
      const angle = Math.hypot(dx, dy) > 0.1 ? Math.atan2(dy, dx) * (180 / Math.PI) : 0;
      headRef.current?.setAttribute(
        "transform",
        `translate(${chain[0].x} ${chain[0].y}) rotate(${angle})`
      );

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
      <path ref={pathRef} fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <polygon ref={headRef} points={`${HEAD_SIZE},0 ${-HEAD_SIZE * 0.6},${HEAD_SIZE * 0.7} ${-HEAD_SIZE * 0.6},${-HEAD_SIZE * 0.7}`} fill="white" />
    </svg>
  );
}
