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
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-border hover:border-foreground/30"
      >
        <span className="h-0.5 w-4 bg-foreground" />
        <span className="h-0.5 w-4 bg-foreground" />
        <span className="h-0.5 w-4 bg-foreground" />
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface shadow-lg transition-transform duration-200 ${
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
            className="text-lg text-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          <Link href="/" onClick={() => setOpen(false)} className="font-medium text-foreground hover:text-brand">
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
                className="text-sm text-foreground hover:text-brand"
              >
                {dept.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Other pages
            </span>
            <Link href="/hacks" onClick={() => setOpen(false)} className="text-sm text-foreground hover:text-brand">
              Hacks &amp; Improvement Ideas
            </Link>
            <Link href="/glossary" onClick={() => setOpen(false)} className="text-sm text-foreground hover:text-brand">
              Glossary
            </Link>
          </div>
        </nav>

        <div className="border-t border-border px-4 py-4">
          <FeedbackForm />
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
      <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
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
        className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
