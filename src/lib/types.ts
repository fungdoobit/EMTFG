// Mirrors the tables in supabase/schema.sql. Kept as plain hand-written
// types (rather than generated ones) since the schema is small and stable —
// one file to scan instead of a generator step in the build.

export type Department = {
  id: string;
  slug: string;
  name: string;
  notes: string | null;
  created_at: string;
};

export type SubDepartment = {
  id: string;
  department_id: string;
  slug: string;
  name: string;
  tools_systems: string[];
  general_note: string | null;
  created_at: string;
};

export type SubDepartmentContact = {
  id: string;
  sub_department_id: string;
  name: string;
  handles: string;
  sort_order: number;
};

export type Process = {
  id: string;
  sub_department_id: string;
  department_id: string;
  slug: string;
  title: string;
  notes: string | null;
  approver: string | null;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
};

export type ProcessStep = {
  id: string;
  process_id: string;
  step_order: number;
  title: string;
  description: string | null;
};

export type ProcessAttachment = {
  id: string;
  process_id: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
};

export type HackStatus = "proposed" | "in_progress" | "done";

export type Hack = {
  id: string;
  process_id: string | null;
  title: string;
  description: string;
  status: HackStatus;
  created_by: string | null;
  created_at: string;
};

export type Feedback = {
  id: string;
  message: string;
  page_path: string | null;
  created_at: string;
};

export type GlossaryTerm = {
  id: string;
  abbreviation: string;
  full_term: string;
  meaning: string;
  sort_order: number;
};

// ── Composed shapes used by pages ────────────────────────────────────────

export type SubDepartmentWithCounts = SubDepartment & {
  process_count: number;
};

export type ProcessSummary = Pick<Process, "id" | "slug" | "title" | "updated_at" | "updated_by">;

export type ProcessWithSubDept = Process & {
  sub_department: Pick<SubDepartment, "id" | "slug" | "name">;
  department: Pick<Department, "id" | "slug" | "name">;
};

export type ProcessDetail = Process & {
  sub_department: Pick<SubDepartment, "id" | "slug" | "name">;
  department: Pick<Department, "id" | "slug" | "name">;
  steps: ProcessStep[];
  hacks: Hack[];
  attachments: ProcessAttachment[];
};

export type HackWithProcess = Hack & {
  process: (Pick<Process, "id" | "slug" | "title"> & {
    sub_department: Pick<SubDepartment, "slug" | "name">;
    department: Pick<Department, "slug">;
  }) | null;
};

export type ProcessOption = {
  id: string;
  title: string;
  sub_department_name: string;
};

export type SearchResult = {
  process: Pick<Process, "id" | "slug" | "title">;
  sub_department: Pick<SubDepartment, "slug" | "name">;
  department: Pick<Department, "slug" | "name">;
  matched_step_titles: string[];
};
