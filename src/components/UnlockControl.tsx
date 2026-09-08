"use client";

import { useActionState, useState } from "react";
import { lock, unlock } from "@/lib/actions";
import { btnPrimary } from "@/lib/ui";

export function UnlockControl({ initiallyUnlocked }: { initiallyUnlocked: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(unlock, null);

  if (initiallyUnlocked) {
    return (
      <form action={lock}>
        <button
          type="submit"
          className="whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-all hover:border-foreground/30 hover:text-foreground active:scale-95"
          title="Lock editing again"
        >
          Unlocked — lock
        </button>
      </form>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-all hover:border-foreground/30 hover:text-foreground active:scale-95"
      >
        Enter passcode to edit
      </button>
    );
  }

  return (
    <form action={formAction} className="animate-page-in flex items-center gap-2">
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
        className={`${btnPrimary} disabled:opacity-60 disabled:active:scale-100`}
      >
        {pending ? "Checking…" : "Unlock"}
      </button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
    </form>
  );
}
