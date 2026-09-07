"use client";

import { useActionState, useState } from "react";
import { lock, unlock } from "@/lib/actions";

export function UnlockControl({ initiallyUnlocked }: { initiallyUnlocked: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(unlock, null);

  if (initiallyUnlocked) {
    return (
      <form action={lock}>
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground hover:border-foreground/30"
          title="Lock editing again"
        >
          🔓 Unlocked — lock
        </button>
      </form>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground hover:border-foreground/30"
      >
        🔒 Enter passcode to edit
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        type="password"
        name="passcode"
        autoFocus
        placeholder="Passcode"
        className="w-32 rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground disabled:opacity-60"
      >
        {pending ? "Checking…" : "Unlock"}
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
