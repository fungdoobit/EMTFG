import Link from "next/link";
import { notFound } from "next/navigation";
import { getProcessesForSubDepartment, getSubDepartmentBySlug } from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { deleteContact } from "@/lib/actions";
import { DeleteButton } from "@/components/DeleteButton";
import { btnPrimary } from "@/lib/ui";

export default async function SubDepartmentPage({
  params,
}: PageProps<"/[deptSlug]/[subSlug]">) {
  const { deptSlug, subSlug } = await params;
  const subDepartment = await getSubDepartmentBySlug(deptSlug, subSlug);
  if (!subDepartment) notFound();

  const [processes, unlocked] = await Promise.all([
    getProcessesForSubDepartment(subDepartment.id),
    isUnlocked(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">
          <Link href="/" className="hover:text-foreground">
            Departments
          </Link>{" "}
          /{" "}
          <Link href={`/${deptSlug}`} className="hover:text-foreground">
            {subDepartment.department.name}
          </Link>{" "}
          / {subDepartment.name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{subDepartment.name}</h1>
      </div>

      {subDepartment.tools_systems.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Tools &amp; systems
          </h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {subDepartment.tools_systems.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-foreground"
              >
                {tool}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Sifu Guide
          </h2>
          <Link
            href={`/${deptSlug}/${subSlug}/contacts/new`}
            className="text-sm font-medium text-brand hover:underline"
          >
            + Add contact
          </Link>
        </div>

        {subDepartment.contacts.length === 0 ? (
          <p className="text-sm text-muted">No contacts listed yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <tbody>
                {subDepartment.contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-background"
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-foreground align-top">
                      {contact.name}
                    </td>
                    <td className="px-3 py-2 text-muted align-top">{contact.handles}</td>
                    {unlocked && (
                      <td className="whitespace-nowrap px-3 py-2 align-top">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/${deptSlug}/${subSlug}/contacts/${contact.id}/edit`}
                            className="text-xs font-medium text-muted hover:text-foreground"
                          >
                            Edit
                          </Link>
                          <form action={deleteContact}>
                            <input type="hidden" name="id" value={contact.id} />
                            <input type="hidden" name="department_slug" value={deptSlug} />
                            <input type="hidden" name="sub_department_slug" value={subSlug} />
                            <DeleteButton confirmMessage={`Remove ${contact.name} from the Sifu Guide?`} />
                          </form>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {subDepartment.general_note && (
        <p className="rounded-lg bg-background px-4 py-3 text-sm text-muted border border-border">
          {subDepartment.general_note}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Processes
          </h2>
          <Link href={`/${deptSlug}/${subSlug}/new`} className={btnPrimary}>
            + Add new process
          </Link>
        </div>

        {processes.length === 0 ? (
          <p className="text-sm text-muted">No processes documented yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
            {processes.map((process) => (
              <li key={process.id}>
                <Link
                  href={`/${deptSlug}/${subSlug}/${process.slug}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-background"
                >
                  <span className="font-medium text-foreground">{process.title}</span>
                  {process.updated_by && (
                    <span className="shrink-0 text-xs text-muted">
                      updated by {process.updated_by}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
