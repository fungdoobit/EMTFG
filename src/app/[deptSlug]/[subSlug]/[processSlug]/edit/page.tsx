import Link from "next/link";
import { notFound } from "next/navigation";
import { getProcessBySlug } from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { ProcessForm } from "@/components/ProcessForm";
import { LockedNotice } from "@/components/LockedNotice";

export default async function EditProcessPage({
  params,
}: PageProps<"/[deptSlug]/[subSlug]/[processSlug]/edit">) {
  const { deptSlug, subSlug, processSlug } = await params;
  const process = await getProcessBySlug(deptSlug, subSlug, processSlug);
  if (!process) notFound();

  const unlocked = await isUnlocked();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">
          <Link href={`/${deptSlug}/${subSlug}/${processSlug}`} className="hover:text-foreground">
            {process.title}
          </Link>{" "}
          / Edit
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Edit {process.title}</h1>
      </div>

      {unlocked ? (
        <ProcessForm
          mode="edit"
          departmentSlug={deptSlug}
          subDepartmentSlug={subSlug}
          processSlug={processSlug}
          processId={process.id}
          initialTitle={process.title}
          initialNotes={process.notes ?? ""}
          initialApprover={process.approver ?? ""}
          initialSteps={process.steps}
          initialAttachments={process.attachments}
        />
      ) : (
        <LockedNotice />
      )}
    </div>
  );
}
