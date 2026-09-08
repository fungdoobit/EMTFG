import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubDepartmentBySlug } from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { ProcessForm } from "@/components/ProcessForm";
import { LockedNotice } from "@/components/LockedNotice";

export default async function NewProcessPage({
  params,
}: PageProps<"/[deptSlug]/[subSlug]/new">) {
  const { deptSlug, subSlug } = await params;
  const subDepartment = await getSubDepartmentBySlug(deptSlug, subSlug);
  if (!subDepartment) notFound();

  const unlocked = await isUnlocked();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">
          <Link href={`/${deptSlug}/${subSlug}`} className="hover:text-foreground">
            {subDepartment.name}
          </Link>{" "}
          / New process
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Add a process to {subDepartment.name}
        </h1>
      </div>

      {unlocked ? (
        <ProcessForm
          mode="create"
          departmentSlug={deptSlug}
          subDepartmentSlug={subSlug}
          subDepartmentId={subDepartment.id}
        />
      ) : (
        <LockedNotice />
      )}
    </div>
  );
}
