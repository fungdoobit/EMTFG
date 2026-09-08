import type { ProcessStep } from "@/lib/types";

/** Renders the ordered steps as a simple top-to-bottom flow: a numbered
 * circle per step connected by a line, the "flow/diagram representation"
 * the spec asks for, generated straight from the ordered steps rather than
 * a separately-maintained diagram. */
export function ProcessFlow({ steps }: { steps: ProcessStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => (
        <li
          key={step.id}
          className="animate-page-in flex gap-4"
          style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
        >
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-indigo-400 text-sm font-semibold text-brand-foreground shadow-elevated">
              {i + 1}
            </span>
            {i < steps.length - 1 && (
              <span className="w-px flex-1 bg-gradient-to-b from-border to-transparent" />
            )}
          </div>
          <div className="pb-6">
            <p className="pt-1 font-medium text-foreground">{step.title}</p>
            {step.description && (
              <p className="mt-1 text-sm text-muted">{step.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
