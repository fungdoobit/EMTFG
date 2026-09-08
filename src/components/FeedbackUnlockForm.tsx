"use client";

import { useActionState } from "react";
import { unlockFeedback } from "@/lib/actions";
import { btnPrimaryLg } from "@/lib/ui";

/** A separate passcode from the general edit passcode — anyone who knows
 * the shared EMT2026-style edit passcode should not automatically be able
 * to read feedback submissions. */
export function FeedbackUnlockForm() {
  const [state, formAction, pending] = useActionState(unlockFeedback, null);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-sm text-muted">Viewing feedback needs its own passcode.</p>
      <form action={formAction} className="flex items-center gap-2">
        <input
          type="password"
          name="passcode"
          autoFocus
          placeholder="Passcode"
          className="w-32 rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
        />
        <button
          type="submit"
          disabled={pending}
          className={`${btnPrimaryLg} disabled:opacity-60 disabled:active:scale-100`}
        >
          {pending ? "Checking…" : "Unlock"}
        </button>
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
