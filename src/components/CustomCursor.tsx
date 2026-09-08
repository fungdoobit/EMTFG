"use client";

import { useEffect, useRef, useState } from "react";

/** A precise dot at the exact pointer position, trailed by a soft circle
 * driven by real spring physics (velocity + stiffness + damping, not a flat
 * lerp) — it overshoots slightly and settles, and stretches into an ellipse
 * along the direction of motion when moving fast, snapping back to a circle
 * at rest. Desktop only (pointer: fine) and fully skipped under
 * prefers-reduced-motion. Text inputs keep the normal cursor (see
 * .custom-cursor-active in globals.css) so the app's forms stay usable. */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

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
    let posX = mouseX;
    let posY = mouseY;
    let velX = 0;
    let velY = 0;

    const STIFFNESS = 0.14;
    const DAMPING = 0.72;

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      }
      const target = e.target as HTMLElement | null;
      setHovering(!!target?.closest("a, button, select, [role='button']"));
    }

    let raf = 0;
    function tick() {
      const ax = (mouseX - posX) * STIFFNESS;
      const ay = (mouseY - posY) * STIFFNESS;
      velX = (velX + ax) * DAMPING;
      velY = (velY + ay) * DAMPING;
      posX += velX;
      posY += velY;

      const speed = Math.min(Math.hypot(velX, velY), 40);
      const stretch = 1 + speed * 0.02;
      const angle = speed > 0.5 ? Math.atan2(velY, velX) * (180 / Math.PI) : 0;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${posX}px, ${posY}px) translate(-50%, -50%) rotate(${angle}deg) scaleX(${stretch})`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-brand"
      />
      <div
        ref={ringRef}
        className={`pointer-events-none fixed left-0 top-0 z-[100] rounded-full border transition-[width,height,background-color,border-color] duration-300 ${
          hovering
            ? "h-12 w-12 border-brand/60 bg-brand/10"
            : "h-8 w-8 border-brand/30 bg-brand/[0.04]"
        }`}
      />
    </>
  );
}
