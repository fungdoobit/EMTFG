import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDepartmentBySlug,
  getHacksForDepartment,
  getSubDepartmentsForDepartment,
} from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { ImprovementIdeasWidget } from "@/components/ImprovementIdeasWidget";

export default async function DepartmentPage({ params }: PageProps<"/[deptSlug]">) {
  const { deptSlug } = await params;
  const department = await getDepartmentBySlug(deptSlug);
  if (!department) notFound();

  const [subDepartments, hacks, unlocked] = await Promise.all([
    getSubDepartmentsForDepartment(department.id),
    getHacksForDepartment(department.id),
    isUnlocked(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">
          <Link href="/" className="hover:text-foreground">
            Departments
          </Link>{" "}
          / {department.name}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{department.name}</h1>
        <p className="mt-1 text-sm text-muted">Pick a sub-department to see its processes.</p>
        {department.notes && (
          <p className="mt-3 rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted">
            {department.notes}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Sub-departments
        </h2>
        <Link
          href={`/${deptSlug}/new`}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground"
        >
          + Add sub-department
        </Link>
      </div>

      {subDepartments.length === 0 ? (
        <p className="text-sm text-muted">No sub-departments yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {subDepartments.map((sub) => (
            <Link
              key={sub.id}
              href={`/${department.slug}/${sub.slug}`}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-sm transition hover:border-brand hover:shadow-md"
            >
              <div>
                <h2 className="text-lg font-medium text-foreground">{sub.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {sub.process_count} {sub.process_count === 1 ? "process" : "processes"}
                </p>
              </div>
              {sub.tools_systems.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {sub.tools_systems.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full bg-background px-2 py-0.5 text-xs text-muted"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <ImprovementIdeasWidget hacks={hacks} departmentSlug={deptSlug} unlocked={unlocked} />
    </div>
  );
}
