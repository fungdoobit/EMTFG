import Link from "next/link";
import { getProcessOptions } from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { HackForm } from "@/components/HackForm";
import { LockedNotice } from "@/components/LockedNotice";

export default async function NewHackPage({
  searchParams,
}: PageProps<"/hacks/new">) {
  const { process_id } = await searchParams;
  const [processOptions, unlocked] = await Promise.all([getProcessOptions(), isUnlocked()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">
          <Link href="/hacks" className="hover:text-foreground">
            Hacks &amp; Improvement Ideas
          </Link>{" "}
          / New
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Suggest a hack</h1>
      </div>

      {unlocked ? (
        <HackForm
          mode="create"
          processOptions={processOptions}
          initialProcessId={typeof process_id === "string" ? process_id : undefined}
        />
      ) : (
        <LockedNotice />
      )}
    </div>
  );
}
