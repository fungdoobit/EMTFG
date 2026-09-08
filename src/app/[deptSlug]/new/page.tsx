import Link from "next/link";
import { notFound } from "next/navigation";
import { getDepartmentBySlug } from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { SubDepartmentForm } from "@/components/SubDepartmentForm";
import { LockedNotice } from "@/components/LockedNotice";

export default async function NewSubDepartmentPage({ params }: PageProps<"/[deptSlug]/new">) {
  const { deptSlug } = await params;
  const department = await getDepartmentBySlug(deptSlug);
  if (!department) notFound();

  const unlocked = await isUnlocked();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">
          <Link href={`/${deptSlug}`} className="hover:text-foreground">
            {department.name}
          </Link>{" "}
          / New sub-department
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Add a sub-department to {department.name}
        </h1>
      </div>

      {unlocked ? (
        <SubDepartmentForm departmentSlug={deptSlug} departmentId={department.id} />
      ) : (
        <LockedNotice />
      )}
    </div>
  );
}
