// Purely cosmetic — gives each department a distinct icon + color so the
// home page and department cards read as more than a plain list of text
// links. Keyed by slug; anything not listed (a department added later via
// the DB) falls back to a generic badge rather than breaking.

type DepartmentVisual = { icon: string; badgeClass: string };

const DEPARTMENT_VISUALS: Record<string, DepartmentVisual> = {
  finance: { icon: "💰", badgeClass: "bg-emerald-100 text-emerald-700" },
  "business-development": { icon: "📈", badgeClass: "bg-blue-100 text-blue-700" },
  "customs-brokerage": { icon: "📦", badgeClass: "bg-amber-100 text-amber-700" },
  "trucking-and-haulage-transportation": {
    icon: "🚚",
    badgeClass: "bg-orange-100 text-orange-700",
  },
  warehousing: { icon: "🏭", badgeClass: "bg-purple-100 text-purple-700" },
};

const DEFAULT_VISUAL: DepartmentVisual = { icon: "🏢", badgeClass: "bg-brand-light text-brand" };

export function getDepartmentVisual(slug: string): DepartmentVisual {
  return DEPARTMENT_VISUALS[slug] ?? DEFAULT_VISUAL;
}
