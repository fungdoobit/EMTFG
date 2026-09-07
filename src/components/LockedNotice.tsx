import { UnlockControl } from "@/components/UnlockControl";

export function LockedNotice() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-sm text-muted">
        Adding, editing, and deleting content needs the shared team passcode.
      </p>
      <UnlockControl initiallyUnlocked={false} />
    </div>
  );
}
