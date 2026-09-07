import { getGlossaryTerms } from "@/lib/queries";

export default async function GlossaryPage() {
  const terms = await getGlossaryTerms();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Glossary</h1>
        <p className="mt-1 text-sm text-muted">
          Abbreviations used across departments — not tied to any one sub-department.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5">Abbr.</th>
              <th className="px-4 py-2.5">Full term</th>
              <th className="px-4 py-2.5">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => (
              <tr key={term.id} className="border-b border-border last:border-0 align-top">
                <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-foreground">
                  {term.abbreviation}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-foreground">{term.full_term}</td>
                <td className="px-4 py-2.5 text-muted">{term.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
