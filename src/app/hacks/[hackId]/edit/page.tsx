import Link from "next/link";
import { notFound } from "next/navigation";
import { getHackById, getProcessOptions } from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { HackForm } from "@/components/HackForm";
import { LockedNotice } from "@/components/LockedNotice";

export default async function EditHackPage({ params }: PageProps<"/hacks/[hackId]/edit">) {
  const { hackId } = await params;
  const hack = await getHackById(hackId);
  if (!hack) notFound();

  const [processOptions, unlocked] = await Promise.all([getProcessOptions(), isUnlocked()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">
          <Link href="/hacks" className="hover:text-foreground">
            Hacks &amp; Improvement Ideas
          </Link>{" "}
          / Edit
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Edit hack</h1>
      </div>

      {unlocked ? (
        <HackForm
          mode="edit"
          hackId={hack.id}
          processOptions={processOptions}
          initialTitle={hack.title}
          initialDescription={hack.description}
          initialProcessId={hack.process?.id ?? ""}
        />
      ) : (
        <LockedNotice />
      )}
    </div>
  );
}
