import Link from "next/link";
import { getDepartments } from "@/lib/queries";

export default async function HomePage() {
  const departments = await getDepartments();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Departments</h1>
        <p className="mt-1 text-sm text-muted">
          Pick a department to browse its processes and tutorials.
        </p>
      </div>

      {departments.length === 0 ? (
        <p className="text-sm text-muted">No departments yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {departments.map((dept) => (
            <Link
              key={dept.id}
              href={`/${dept.slug}`}
              className="rounded-lg border border-border bg-surface p-5 shadow-sm transition hover:border-brand hover:shadow-md"
            >
              <h2 className="text-lg font-medium text-foreground">{dept.name}</h2>
              <p className="mt-1 text-sm text-muted">Browse sub-departments and processes →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
