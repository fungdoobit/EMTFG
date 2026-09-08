"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { submitFeedback } from "@/lib/actions";
import type { Department } from "@/lib/types";

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

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-semibold text-foreground">Menu</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="text-lg text-muted transition-transform duration-200 hover:rotate-90 hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="inline-block w-fit font-medium text-foreground transition-transform hover:translate-x-0.5 hover:text-brand"
          >
            Home
          </Link>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Departments
            </span>
            {departments.map((dept) => (
              <Link
                key={dept.id}
                href={`/${dept.slug}`}
                onClick={() => setOpen(false)}
                className="inline-block w-fit text-sm text-foreground transition-transform hover:translate-x-0.5 hover:text-brand"
              >
                {dept.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Other pages
            </span>
            <Link
              href="/hacks"
              onClick={() => setOpen(false)}
              className="inline-block w-fit text-sm text-foreground transition-transform hover:translate-x-0.5 hover:text-brand"
            >
              Hacks &amp; Improvement Ideas
            </Link>
            <Link
              href="/glossary"
              onClick={() => setOpen(false)}
              className="inline-block w-fit text-sm text-foreground transition-transform hover:translate-x-0.5 hover:text-brand"
            >
              Glossary
            </Link>
          </div>
        </nav>

        <div className="border-t border-border px-4 py-4">
          <FeedbackForm />
          <Link
            href="/feedback"
            onClick={() => setOpen(false)}
            className="mt-2 inline-block text-xs text-muted hover:text-brand"
          >
            View past feedback →
          </Link>
          <p className="mt-4 text-center text-xs text-muted">Designed and developed by Isaac Tham</p>
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
      <p className="animate-page-in rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
        Thanks — feedback sent!
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label htmlFor="feedback-message" className="text-xs font-semibold uppercase tracking-wide text-muted">
        Feedback
      </label>
      <input type="hidden" name="page_path" value={pathname} />
      <textarea
        id="feedback-message"
        name="message"
        required
        rows={3}
        placeholder="What should be improved or changed?"
        className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:bg-brand-hover active:scale-95 disabled:opacity-60 disabled:active:scale-100"
      >
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
