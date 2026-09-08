import Link from "next/link";
import { notFound } from "next/navigation";
import { getSubDepartmentBySlug } from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { ContactForm } from "@/components/ContactForm";
import { LockedNotice } from "@/components/LockedNotice";

export default async function EditContactPage({
  params,
}: PageProps<"/[deptSlug]/[subSlug]/contacts/[contactId]/edit">) {
  const { deptSlug, subSlug, contactId } = await params;
  const subDepartment = await getSubDepartmentBySlug(deptSlug, subSlug);
  if (!subDepartment) notFound();

  const contact = subDepartment.contacts.find((c) => c.id === contactId);
  if (!contact) notFound();

  const unlocked = await isUnlocked();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">
          <Link href={`/${deptSlug}/${subSlug}`} className="hover:text-foreground">
            {subDepartment.name}
          </Link>{" "}
          / Edit Sifu Guide contact
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Edit {contact.name}</h1>
      </div>

      {unlocked ? (
        <ContactForm
          mode="edit"
          departmentSlug={deptSlug}
          subDepartmentSlug={subSlug}
          contactId={contact.id}
          initialName={contact.name}
          initialHandles={contact.handles}
        />
      ) : (
        <LockedNotice />
      )}
    </div>
  );
}
