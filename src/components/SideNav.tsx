"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { submitFeedback } from "@/lib/actions";
import type { Department } from "@/lib/types";

// Opaque near the left (where the nav text lives), fading to fully
// transparent toward the right — paired with a backdrop-blur layer
// underneath, so what shows through on the right is the real page,
// softly blurred, instead of a hard-edged panel.
const GRADIENT_OVERLAY = {
  backgroundImage: [
    "linear-gradient(100deg,",
    "color-mix(in oklab, var(--brand) 22%, var(--surface)) 0%,",
    "color-mix(in oklab, var(--accent) 16%, var(--surface)) 40%,",
    "transparent 85%)",
  ].join(" "),
};

export function SideNav({ departments }: { departments: Department[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border transition-colors hover:border-brand hover:bg-background active:scale-90"
      >
        <span className="relative block h-4 w-4">
          <span
            className={`absolute inset-x-0 h-0.5 rounded-full bg-foreground transition-all duration-300 ease-out ${
              open ? "top-[7px] rotate-45" : "top-0 rotate-0"
            }`}
          />
          <span
            className={`absolute inset-x-0 top-[7px] h-0.5 rounded-full bg-foreground transition-all duration-150 ${
              open ? "scale-0 opacity-0" : "scale-100 opacity-100"
            }`}
          />
          <span
            className={`absolute inset-x-0 h-0.5 rounded-full bg-foreground transition-all duration-300 ease-out ${
              open ? "top-[7px] -rotate-45" : "top-[14px] rotate-0"
            }`}
          />
        </span>
      </button>

      {/* Full-screen takeover, but not a flat opaque panel: a blur layer
       * sits behind everything, and an opaque-to-transparent gradient sits
       * on top of that — solid color where the text lives, fading away so
       * the real page shows through, softly blurred, toward the right.
       * The blur is on this panel itself, not an ancestor of anything
       * fixed, so it doesn't repeat the header's containing-block bug. */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-500 ease-out ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <div className="absolute inset-0 backdrop-blur-md" />
        <div className="absolute inset-0" style={GRADIENT_OVERLAY} />

        <div className="relative flex h-full flex-col overflow-y-auto p-6 sm:p-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Menu
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-2xl text-foreground transition-transform duration-200 hover:rotate-90"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-3 py-12 sm:gap-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="w-fit text-3xl font-semibold tracking-tight text-foreground transition-transform hover:translate-x-1.5 hover:text-brand sm:text-4xl"
            >
              Home
            </Link>
            {departments.map((dept) => (
              <Link
                key={dept.id}
                href={`/${dept.slug}`}
                onClick={() => setOpen(false)}
                className="w-fit text-3xl font-semibold tracking-tight text-foreground transition-transform hover:translate-x-1.5 hover:text-brand sm:text-4xl"
              >
                {dept.name}
              </Link>
            ))}
            <Link
              href="/hacks"
              onClick={() => setOpen(false)}
              className="w-fit text-3xl font-semibold tracking-tight text-foreground transition-transform hover:translate-x-1.5 hover:text-brand sm:text-4xl"
            >
              Hacks
            </Link>
            <Link
              href="/glossary"
              onClick={() => setOpen(false)}
              className="w-fit text-3xl font-semibold tracking-tight text-foreground transition-transform hover:translate-x-1.5 hover:text-brand sm:text-4xl"
            >
              Glossary
            </Link>
          </nav>

          <div className="flex flex-col gap-2 border-t border-border/60 pt-6">
            <FeedbackForm />
            <Link
              href="/feedback"
              onClick={() => setOpen(false)}
              className="text-xs text-muted hover:text-brand"
            >
              View past feedback →
            </Link>
            <p className="text-xs text-muted">Designed and developed by Isaac Tham</p>
          </div>
        </div>
      </div>
    </>
  );
}

function FeedbackForm() {
  const pathname = usePathname();
  const [state, formAction, pending] = useActionState(submitFeedback, null);

  if (state && "success" in state) {
    return (
      <p className="animate-page-in text-sm text-green-700">Thanks — feedback sent!</p>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-2">
      <label
        htmlFor="feedback-message"
        className="text-xs font-semibold uppercase tracking-wide text-muted"
      >
        Feedback
      </label>
      <input type="hidden" name="page_path" value={pathname} />
      <div className="flex gap-2">
        <textarea
          id="feedback-message"
          name="message"
          required
          rows={1}
          placeholder="What should be improved or changed?"
          className="flex-1 resize-none rounded-md border border-border bg-surface/70 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-60 disabled:active:scale-100"
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
