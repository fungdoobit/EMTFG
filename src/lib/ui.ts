// Shared class strings for the handful of interactive primitives repeated
// across the app (buttons, cards) — one place to tune hover/press motion
// consistently instead of it drifting slightly different in every file.

export const btnPrimary =
  "rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground transition-all duration-150 hover:bg-brand-hover active:scale-95";

export const btnPrimaryLg =
  "rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-all duration-150 hover:bg-brand-hover active:scale-[0.97]";

export const btnSecondary =
  "rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-all duration-150 hover:border-brand hover:bg-background active:scale-95";

export const cardClass =
  "rounded-lg border border-border bg-surface p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand hover:shadow-md active:translate-y-0";
