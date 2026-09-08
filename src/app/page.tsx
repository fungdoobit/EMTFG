import Link from "next/link";
import { getDepartments } from "@/lib/queries";
import { cardClass } from "@/lib/ui";

export default async function HomePage() {
  const departments = await getDepartments();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Departments</h1>
        <p className="mt-1.5 text-base text-muted">
          Pick a department to browse its processes and tutorials.
        </p>
      </div>

      {departments.length === 0 ? (
        <p className="text-sm text-muted">No departments yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {departments.map((dept, i) => (
            <Link
              key={dept.id}
              href={`/${dept.slug}`}
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
              className={`group animate-page-in flex items-center justify-between gap-4 ${cardClass}`}
            >
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                  {dept.name}
                </h2>
                <p className="mt-1 text-sm text-muted">Browse sub-departments and processes</p>
              </div>
              <span className="shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand">
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
