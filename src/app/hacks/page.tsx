import Link from "next/link";
import { getAllHacks } from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { deleteHack } from "@/lib/actions";
import { HackCard } from "@/components/HackCard";
import { HackStatusControl } from "@/components/HackStatus";
import { DeleteButton } from "@/components/DeleteButton";
import { btnPrimary } from "@/lib/ui";
import type { HackWithProcess } from "@/lib/types";

function HackActions({ hack }: { hack: HackWithProcess }) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <Link href={`/hacks/${hack.id}/edit`} className="text-xs font-medium text-muted hover:text-foreground">
        Edit
      </Link>
      <form action={deleteHack}>
        <input type="hidden" name="id" value={hack.id} />
        <DeleteButton confirmMessage={`Delete "${hack.title}"?`} />
      </form>
    </div>
  );
}

export default async function HacksPage() {
  const [hacks, unlocked] = await Promise.all([getAllHacks(), isUnlocked()]);
  const linked = hacks.filter((h) => h.process);
  const unlinked = hacks.filter((h) => !h.process);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Hacks &amp; Improvement Ideas</h1>
          <p className="mt-1 text-sm text-muted">
            Every hack suggested across every process, plus standalone ideas with no process yet.
          </p>
        </div>
        <Link href="/hacks/new" className={btnPrimary}>
          + Suggest a hack
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Linked to a process ({linked.length})
        </h2>
        {linked.length === 0 ? (
          <p className="text-sm text-muted">None yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {linked.map((hack) => (
              <HackCard
                key={hack.id}
                hack={hack}
                processLink={
                  hack.process
                    ? {
                        href: `/${hack.process.department.slug}/${hack.process.sub_department.slug}/${hack.process.slug}`,
                        label: hack.process.title,
                      }
                    : undefined
                }
                actions={unlocked ? <HackActions hack={hack} /> : undefined}
                statusControl={
                  unlocked ? <HackStatusControl hackId={hack.id} status={hack.status} /> : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Standalone ideas ({unlinked.length})
        </h2>
        {unlinked.length === 0 ? (
          <p className="text-sm text-muted">None yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {unlinked.map((hack) => (
              <HackCard
                key={hack.id}
                hack={hack}
                actions={unlocked ? <HackActions hack={hack} /> : undefined}
                statusControl={
                  unlocked ? <HackStatusControl hackId={hack.id} status={hack.status} /> : undefined
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
