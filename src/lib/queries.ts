import "server-only";
import { createReadOnlyClient } from "@/lib/supabase/client";
import type {
  Department,
  GlossaryTerm,
  HackWithProcess,
  ProcessDetail,
  ProcessOption,
  ProcessSummary,
  SearchResult,
  SubDepartment,
  SubDepartmentContact,
  SubDepartmentWithCounts,
} from "@/lib/types";

// Every function here is read-only (anon key) and safe to call from Server
// Components. Nothing here checks the passcode — reading is open to anyone
// with the link, per the spec.

export async function getDepartments(): Promise<Department[]> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}

export async function getDepartmentBySlug(slug: string): Promise<Department | null> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSubDepartmentsForDepartment(
  departmentId: string
): Promise<SubDepartmentWithCounts[]> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from("sub_departments")
    .select("*, processes(count)")
    .eq("department_id", departmentId)
    .order("name");
  if (error) throw error;
  return data.map((row) => {
    const { processes, ...rest } = row as typeof row & {
      processes: { count: number }[];
    };
    return { ...rest, process_count: processes?.[0]?.count ?? 0 };
  });
}

export type SubDepartmentDetail = SubDepartment & {
  department: Pick<Department, "id" | "slug" | "name">;
  contacts: SubDepartmentContact[];
};

export async function getSubDepartmentBySlug(
  departmentSlug: string,
  subDepartmentSlug: string
): Promise<SubDepartmentDetail | null> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from("sub_departments")
    .select(
      "*, department:departments!inner(id, slug, name), contacts:sub_department_contacts(*)"
    )
    .eq("slug", subDepartmentSlug)
    .eq("department.slug", departmentSlug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { contacts, ...rest } = data;
  return {
    ...rest,
    contacts: [...contacts].sort((a, b) => a.sort_order - b.sort_order),
  } as SubDepartmentDetail;
}

export async function getProcessesForSubDepartment(
  subDepartmentId: string
): Promise<ProcessSummary[]> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from("processes")
    .select("id, slug, title, updated_at, updated_by")
    .eq("sub_department_id", subDepartmentId)
    .order("title");
  if (error) throw error;
  return data;
}

export async function getProcessBySlug(
  departmentSlug: string,
  subDepartmentSlug: string,
  processSlug: string
): Promise<ProcessDetail | null> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from("processes")
    .select(
      `*,
      sub_department:sub_departments!inner(id, slug, name),
      department:departments!inner(id, slug, name),
      steps:process_steps(*),
      hacks(*),
      attachments:process_attachments(*)`
    )
    .eq("slug", processSlug)
    .eq("sub_department.slug", subDepartmentSlug)
    .eq("department.slug", departmentSlug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { steps, hacks, attachments, ...rest } = data;
  return {
    ...rest,
    steps: [...steps].sort((a, b) => a.step_order - b.step_order),
    hacks: [...hacks].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    attachments,
  } as ProcessDetail;
}

export async function getHackById(id: string): Promise<HackWithProcess | null> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from("hacks")
    .select(
      `*,
      process:processes(
        id, slug, title,
        sub_department:sub_departments(slug, name),
        department:departments(slug)
      )`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as HackWithProcess | null;
}

export async function getAllHacks(): Promise<HackWithProcess[]> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from("hacks")
    .select(
      `*,
      process:processes(
        id, slug, title,
        sub_department:sub_departments(slug, name),
        department:departments(slug)
      )`
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as HackWithProcess[];
}

export async function getGlossaryTerms(): Promise<GlossaryTerm[]> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data;
}

/** Flat list of every process, for the "link to a process" picker on the
 * hack form. Small enough (a few dozen rows) to load in full and filter
 * client-side rather than building a server-side search-as-you-type. */
export async function getProcessOptions(): Promise<ProcessOption[]> {
  const supabase = createReadOnlyClient();
  const { data, error } = await supabase
    .from("processes")
    .select("id, title, sub_department:sub_departments(name)")
    .order("title");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    sub_department_name: (row.sub_department as unknown as { name: string } | null)?.name ?? "",
  }));
}

/** Basic search across process titles and step content. Two small queries
 * merged in application code — simpler than a tsvector/full-text setup for
 * a dataset this size, and easy to reason about. */
export async function searchProcesses(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = createReadOnlyClient();
  const pattern = `%${trimmed}%`;
  const stepSelect = `title, description,
        process:processes(
          id, slug, title,
          sub_department:sub_departments(slug, name),
          department:departments(slug, name)
        )`;

  // Three separate ilike queries instead of one `.or(...)` filter — PostgREST's
  // or-filter syntax requires special escaping for values containing commas
  // or parentheses, which a free-text search box will regularly produce.
  // Three simple queries merged here avoids that escaping entirely.
  const [byTitle, byStepTitle, byStepDescription] = await Promise.all([
    supabase
      .from("processes")
      .select(
        `id, slug, title,
        sub_department:sub_departments(slug, name),
        department:departments(slug, name)`
      )
      .ilike("title", pattern),
    supabase.from("process_steps").select(stepSelect).ilike("title", pattern),
    supabase.from("process_steps").select(stepSelect).ilike("description", pattern),
  ]);

  if (byTitle.error) throw byTitle.error;
  if (byStepTitle.error) throw byStepTitle.error;
  if (byStepDescription.error) throw byStepDescription.error;

  const results = new Map<string, SearchResult>();

  for (const row of byTitle.data) {
    results.set(row.id, {
      process: { id: row.id, slug: row.slug, title: row.title },
      sub_department: row.sub_department as unknown as SearchResult["sub_department"],
      department: row.department as unknown as SearchResult["department"],
      matched_step_titles: [],
    });
  }

  for (const row of [...byStepTitle.data, ...byStepDescription.data]) {
    const process = row.process as unknown as {
      id: string;
      slug: string;
      title: string;
      sub_department: SearchResult["sub_department"];
      department: SearchResult["department"];
    };
    const existing = results.get(process.id);
    if (existing) {
      if (!existing.matched_step_titles.includes(row.title)) {
        existing.matched_step_titles.push(row.title);
      }
    } else {
      results.set(process.id, {
        process: { id: process.id, slug: process.slug, title: process.title },
        sub_department: process.sub_department,
        department: process.department,
        matched_step_titles: [row.title],
      });
    }
  }

  return [...results.values()].sort((a, b) => a.process.title.localeCompare(b.process.title));
}
