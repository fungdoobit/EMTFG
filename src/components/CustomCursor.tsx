"use client";

import { useEffect, useRef, useState } from "react";

/** The exact pointer position is a fixed pivot; a short tail is anchored
 * there and swings to point back along the direction of recent movement,
 * lagging with rotational inertia (shortest-path angle lerp, so it never
 * spins the long way around) and growing longer the faster the pointer
 * moves, retracting toward nothing at rest. No dot-and-ring pair — this is
 * one small pivot mark plus one tail.
 *
 * Desktop only (pointer: fine) and fully skipped under
 * prefers-reduced-motion. Text inputs keep the normal cursor (see
 * .custom-cursor-active in globals.css) so the app's many forms stay
 * usable. */
export function CustomCursor() {
  const pivotRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);
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
    let prevX = mouseX;
    let prevY = mouseY;
    let smoothAngle = 0;
    let smoothLength = 0;

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (pivotRef.current) {
        pivotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      }
      const target = e.target as HTMLElement | null;
      setHovering(!!target?.closest("a, button, select, [role='button']"));
    }

    let raf = 0;
    function tick() {
      const dx = mouseX - prevX;
      const dy = mouseY - prevY;
      prevX = mouseX;
      prevY = mouseY;

      const speed = Math.hypot(dx, dy);

      if (speed > 0.3) {
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        let delta = targetAngle - smoothAngle;
        delta = ((delta + 180) % 360 + 360) % 360 - 180;
        smoothAngle += delta * 0.22;
      }

      const targetLength = Math.min(speed * 2.4, 54);
      smoothLength += (targetLength - smoothLength) * 0.15;

      if (tailRef.current) {
        tailRef.current.style.width = `${smoothLength}px`;
        tailRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px) translateY(-50%) rotate(${smoothAngle}deg)`;
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
        ref={tailRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-[2px] origin-left rounded-full bg-gradient-to-r from-brand/70 to-transparent"
      />
      <div
        ref={pivotRef}
        className={`pointer-events-none fixed left-0 top-0 z-[100] rounded-full bg-brand transition-[width,height] duration-200 ${
          hovering ? "h-3 w-3" : "h-1.5 w-1.5"
        }`}
      />
    </>
  );
}
