import Link from "next/link";
import type { HackStatus, HackWithProcess } from "@/lib/types";
import { HackStatusBadge, HackStatusControl } from "@/components/HackStatus";

const STATUS_RANK: Record<HackStatus, number> = { proposed: 0, in_progress: 0, done: 1 };

export function ImprovementIdeasWidget({
  hacks,
  departmentSlug,
  unlocked,
}: {
  hacks: HackWithProcess[];
  departmentSlug: string;
  unlocked: boolean;
}) {
  const counts = { proposed: 0, in_progress: 0, done: 0 } as Record<HackStatus, number>;
  for (const hack of hacks) counts[hack.status]++;

  const sorted = [...hacks].sort((a, b) => {
    const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Improvement Ideas
        </h2>
        <Link href="/hacks/new" className="text-sm font-medium text-brand hover:underline">
          + Suggest one
        </Link>
      </div>

      {hacks.length === 0 ? (
        <p className="text-sm text-muted">No improvement ideas logged for this department yet.</p>
      ) : (
        <>
          <p className="text-xs text-muted">
            {counts.proposed} Proposed · {counts.in_progress} In Progress · {counts.done} Done
          </p>
          <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface shadow-elevated">
            {sorted.map((hack) => (
              <li
                key={hack.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-background"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{hack.title}</span>
                  {hack.process && (
                    <Link
                      href={`/${hack.process.department.slug}/${hack.process.sub_department.slug}/${hack.process.slug}`}
                      className="truncate text-xs text-muted hover:text-brand"
                    >
                      {hack.process.title}
                    </Link>
                  )}
                </div>
                {unlocked ? (
                  <HackStatusControl hackId={hack.id} status={hack.status} departmentSlug={departmentSlug} />
                ) : (
                  <HackStatusBadge status={hack.status} />
                )}
              </li>
            ))}
          </ul>
          <Link href="/hacks" className="self-start text-sm font-medium text-brand hover:underline">
            View all hacks →
          </Link>
        </>
      )}
    </section>
  );
}
