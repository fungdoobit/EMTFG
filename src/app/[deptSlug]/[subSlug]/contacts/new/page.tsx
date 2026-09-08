import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubDepartmentBySlug } from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { ContactForm } from "@/components/ContactForm";
import { LockedNotice } from "@/components/LockedNotice";

export default async function NewContactPage({
  params,
}: PageProps<"/[deptSlug]/[subSlug]/contacts/new">) {
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
          / New Sifu Guide contact
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Add a Sifu Guide contact to {subDepartment.name}
        </h1>
      </div>

      {unlocked ? (
        <ContactForm
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
