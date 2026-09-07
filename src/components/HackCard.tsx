import Link from "next/link";
import type { Hack } from "@/lib/types";

export function HackCard({
  hack,
  processLink,
  actions,
}: {
  hack: Hack;
  processLink?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-foreground">🔧 {hack.title}</h3>
        {actions}
      </div>
      <p className="mt-1.5 text-sm text-muted">{hack.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {hack.created_by && <span>Suggested by {hack.created_by}</span>}
        {processLink ? (
          <Link href={processLink.href} className="text-brand hover:underline">
            {processLink.label} →
          </Link>
        ) : (
          <span className="italic">Standalone idea — no process yet</span>
        )}
      </div>
    </div>
  );
}
