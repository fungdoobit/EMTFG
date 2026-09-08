import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDepartmentBySlug,
  getHacksForDepartment,
  getSubDepartmentsForDepartment,
} from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { ImprovementIdeasWidget } from "@/components/ImprovementIdeasWidget";
import { getDepartmentVisual } from "@/lib/departmentIcons";
import { btnPrimary, cardClass } from "@/lib/ui";

export default async function DepartmentPage({ params }: PageProps<"/[deptSlug]">) {
  const { deptSlug } = await params;
  const department = await getDepartmentBySlug(deptSlug);
  if (!department) notFound();

  const [subDepartments, hacks, unlocked] = await Promise.all([
    getSubDepartmentsForDepartment(department.id),
    getHacksForDepartment(department.id),
    isUnlocked(),
  ]);

  const { icon, badgeClass } = getDepartmentVisual(department.slug);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-muted">
          <Link href="/" className="hover:text-foreground">
            Departments
          </Link>{" "}
          / {department.name}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl ${badgeClass}`}
          >
            {icon}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{department.name}</h1>
        </div>
        <p className="mt-2 text-sm text-muted">Pick a sub-department to see its processes.</p>
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
        <Link href={`/${deptSlug}/new`} className={btnPrimary}>
          + Add sub-department
        </Link>
      </div>

      {subDepartments.length === 0 ? (
        <p className="text-sm text-muted">No sub-departments yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {subDepartments.map((sub, i) => (
            <Link
              key={sub.id}
              href={`/${department.slug}/${sub.slug}`}
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
              className={`animate-page-in flex flex-col gap-3 ${cardClass}`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-light text-base text-brand">
                  📁
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                    {sub.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">
                    {sub.process_count} {sub.process_count === 1 ? "process" : "processes"}
                  </p>
                </div>
              </div>
              {sub.tools_systems.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {sub.tools_systems.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted"
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
