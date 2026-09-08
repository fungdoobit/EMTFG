import Link from "next/link";
import { searchProcesses } from "@/lib/queries";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const results = query ? await searchProcesses(query) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Search</h1>
        {query && (
          <p className="mt-1 text-sm text-muted">
            {results.length} {results.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      {!query ? (
        <p className="text-sm text-muted">Type in the search bar above to find a process.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted">No processes matched that search.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface shadow-elevated">
          {results.map((result) => (
            <li key={result.process.id} className="px-4 py-3 transition-colors hover:bg-background">
              <Link
                href={`/${result.department.slug}/${result.sub_department.slug}/${result.process.slug}`}
                className="font-medium text-foreground hover:text-brand"
              >
                {result.process.title}
              </Link>
              <p className="mt-0.5 text-xs text-muted">
                {result.department.name} / {result.sub_department.name}
              </p>
              {result.matched_step_titles.length > 0 && (
                <p className="mt-1 text-sm text-muted">
                  Matched step: {result.matched_step_titles.slice(0, 2).join("; ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
