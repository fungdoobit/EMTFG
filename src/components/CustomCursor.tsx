"use client";

import { useEffect, useRef, useState } from "react";

/** A small dot that tracks the mouse exactly, plus a larger ring that trails
 * behind it with a bit of spring lag — the "cursor style" agency sites use.
 * Desktop only (pointer: fine) and off entirely under prefers-reduced-motion;
 * a phone or trackpad-less touch device never sees this. Text inputs keep
 * the normal cursor (see the .custom-cursor-active rules in globals.css) so
 * the app's many forms stay usable. */
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
    let ringX = mouseX;
    let ringY = mouseY;

    function place(el: HTMLDivElement | null, x: number, y: number) {
      if (el) el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }

    function onMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      place(dotRef.current, mouseX, mouseY);
      const target = e.target as HTMLElement | null;
      setHovering(!!target?.closest("a, button, select, [role='button']"));
    }

    let raf = 0;
    function tick() {
      ringX += (mouseX - ringX) * 0.2;
      ringY += (mouseY - ringY) * 0.2;
      place(ringRef.current, ringX, ringY);
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
        className={`pointer-events-none fixed left-0 top-0 z-[100] rounded-full border transition-[width,height,background-color,border-color] duration-200 ${
          hovering ? "h-11 w-11 border-brand bg-brand/10" : "h-7 w-7 border-brand/40 bg-transparent"
        }`}
      />
    </>
  );
}
