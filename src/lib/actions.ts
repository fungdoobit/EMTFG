"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  checkFeedbackPasscode,
  checkPasscode,
  clearFeedbackUnlockedCookie,
  clearUnlockedCookie,
  requireUnlocked,
  setFeedbackUnlockedCookie,
  setUnlockedCookie,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

const ATTACHMENTS_BUCKET = "process-attachments";

/** Uploads any real files found under the "attachments" field to Storage
 * and records them in process_attachments. Browsers always submit the
 * <input type="file"> field even when empty, as a zero-byte File named
 * "" — that's filtered out here rather than in the form. */
async function uploadAttachments(
  supabase: SupabaseAdmin,
  processId: string,
  formData: FormData
): Promise<string | null> {
  const files = formData.getAll("attachments").filter(
    (f): f is File => f instanceof File && f.size > 0 && f.name !== ""
  );

  for (const file of files) {
    const path = `${processId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) return `Could not upload "${file.name}": ${uploadError.message}`;

    const { data: publicUrl } = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path);
    const { error: insertError } = await supabase.from("process_attachments").insert({
      process_id: processId,
      file_url: publicUrl.publicUrl,
      file_name: file.name,
    });
    if (insertError) return `Could not save attachment "${file.name}": ${insertError.message}`;
  }

  return null;
}

export type ActionState = { error: string } | null;

// ── Passcode gate ──────────────────────────────────────────────────────

export async function unlock(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const passcode = String(formData.get("passcode") ?? "");
  if (!passcode) return { error: "Enter the passcode." };
  if (!checkPasscode(passcode)) return { error: "That passcode isn't right." };
  await setUnlockedCookie();
  return null;
}

export async function lock(): Promise<void> {
  await clearUnlockedCookie();
  revalidatePath("/", "layout");
}

export async function unlockFeedback(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const passcode = String(formData.get("passcode") ?? "");
  if (!passcode) return { error: "Enter the passcode." };
  if (!checkFeedbackPasscode(passcode)) return { error: "That passcode isn't right." };
  await setFeedbackUnlockedCookie();
  return null;
}

export async function lockFeedback(): Promise<void> {
  await clearFeedbackUnlockedCookie();
  revalidatePath("/feedback");
}

// ── Shared helpers ────────────────────────────────────────────────────

function readSteps(formData: FormData) {
  const titles = formData.getAll("step_title").map((v) => String(v).trim());
  const descriptions = formData.getAll("step_description").map((v) => String(v).trim());
  return titles
    .map((title, i) => ({ title, description: descriptions[i] || null }))
    .filter((step) => step.title.length > 0)
    .map((step, i) => ({ ...step, step_order: i + 1 }));
}

// ── Processes ─────────────────────────────────────────────────────────

export async function createProcess(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireUnlocked();

  const title = String(formData.get("title") ?? "").trim();
  const subDepartmentId = String(formData.get("sub_department_id") ?? "");
  const departmentSlug = String(formData.get("department_slug") ?? "");
  const subDepartmentSlug = String(formData.get("sub_department_slug") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const approver = String(formData.get("approver") ?? "").trim();
  const authorName = String(formData.get("author_name") ?? "").trim();
  const steps = readSteps(formData);

  if (!title) return { error: "Title is required." };
  if (!subDepartmentId) return { error: "Choose a sub-department." };
  if (steps.length === 0) return { error: "Add at least one step." };
  if (!authorName) return { error: "Enter your name so others know who added this." };

  const supabase = createAdminClient();
  const { data: department, error: deptError } = await supabase
    .from("departments")
    .select("id")
    .eq("slug", departmentSlug)
    .single();
  if (deptError || !department) return { error: "Could not resolve department." };

  const slug = slugify(title);

  const { data: process, error: processError } = await supabase
    .from("processes")
    .insert({
      sub_department_id: subDepartmentId,
      department_id: department.id,
      slug,
      title,
      notes: notes || null,
      approver: approver || null,
      created_by: authorName,
      updated_by: authorName,
    })
    .select("id")
    .single();

  if (processError) {
    if (processError.code === "23505") {
      return { error: "A process with a matching title already exists in this sub-department." };
    }
    return { error: `Could not save process: ${processError.message}` };
  }

  const { error: stepsError } = await supabase
    .from("process_steps")
    .insert(steps.map((step) => ({ ...step, process_id: process.id })));
  if (stepsError) return { error: `Could not save steps: ${stepsError.message}` };

  const attachmentError = await uploadAttachments(supabase, process.id, formData);
  if (attachmentError) return { error: attachmentError };

  revalidatePath(`/${departmentSlug}/${subDepartmentSlug}`);
  redirect(`/${departmentSlug}/${subDepartmentSlug}/${slug}`);
}

export async function updateProcess(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireUnlocked();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const approver = String(formData.get("approver") ?? "").trim();
  const authorName = String(formData.get("author_name") ?? "").trim();
  const departmentSlug = String(formData.get("department_slug") ?? "");
  const subDepartmentSlug = String(formData.get("sub_department_slug") ?? "");
  const processSlug = String(formData.get("process_slug") ?? "");
  const steps = readSteps(formData);

  if (!id) return { error: "Missing process id." };
  if (!title) return { error: "Title is required." };
  if (steps.length === 0) return { error: "Add at least one step." };
  if (!authorName) return { error: "Enter your name so others know who edited this." };

  const supabase = createAdminClient();

  const { error: processError } = await supabase
    .from("processes")
    .update({ title, notes: notes || null, approver: approver || null, updated_by: authorName })
    .eq("id", id);
  if (processError) return { error: `Could not save process: ${processError.message}` };

  // Replace all steps rather than diffing — simplest correct way to handle
  // reordering, inserts, and deletes from a form that just submits the
  // current full list.
  const { error: deleteError } = await supabase.from("process_steps").delete().eq("process_id", id);
  if (deleteError) return { error: `Could not save steps: ${deleteError.message}` };

  const { error: stepsError } = await supabase
    .from("process_steps")
    .insert(steps.map((step) => ({ ...step, process_id: id })));
  if (stepsError) return { error: `Could not save steps: ${stepsError.message}` };

  const removedAttachmentIds = formData.getAll("remove_attachment").map(String);
  if (removedAttachmentIds.length > 0) {
    const { error: removeError } = await supabase
      .from("process_attachments")
      .delete()
      .in("id", removedAttachmentIds);
    if (removeError) return { error: `Could not remove attachment: ${removeError.message}` };
  }

  const attachmentError = await uploadAttachments(supabase, id, formData);
  if (attachmentError) return { error: attachmentError };

  revalidatePath(`/${departmentSlug}/${subDepartmentSlug}/${processSlug}`);
  revalidatePath(`/${departmentSlug}/${subDepartmentSlug}`);
  redirect(`/${departmentSlug}/${subDepartmentSlug}/${processSlug}`);
}

export async function deleteProcess(formData: FormData): Promise<void> {
  await requireUnlocked();

  const id = String(formData.get("id") ?? "");
  const departmentSlug = String(formData.get("department_slug") ?? "");
  const subDepartmentSlug = String(formData.get("sub_department_slug") ?? "");
  if (!id) throw new Error("Missing process id.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("processes").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/${departmentSlug}/${subDepartmentSlug}`);
  revalidatePath("/hacks");
  redirect(`/${departmentSlug}/${subDepartmentSlug}`);
}

// ── Sub-departments ──────────────────────────────────────────────────

export async function createSubDepartment(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUnlocked();

  const departmentSlug = String(formData.get("department_slug") ?? "");
  const departmentId = String(formData.get("department_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const toolsSystems = String(formData.get("tools_systems") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const generalNote = String(formData.get("general_note") ?? "").trim();

  if (!name) return { error: "Name is required." };

  const supabase = createAdminClient();
  const slug = slugify(name);

  const { error } = await supabase.from("sub_departments").insert({
    department_id: departmentId,
    slug,
    name,
    tools_systems: toolsSystems,
    general_note: generalNote || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A sub-department with a matching name already exists here." };
    }
    return { error: `Could not save sub-department: ${error.message}` };
  }

  revalidatePath(`/${departmentSlug}`);
  redirect(`/${departmentSlug}/${slug}`);
}

// ── Sifu Guide contacts ──────────────────────────────────────────────

export async function createContact(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireUnlocked();

  const subDepartmentId = String(formData.get("sub_department_id") ?? "");
  const departmentSlug = String(formData.get("department_slug") ?? "");
  const subDepartmentSlug = String(formData.get("sub_department_slug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const handles = String(formData.get("handles") ?? "").trim();

  if (!name) return { error: "Name is required." };
  if (!handles) return { error: "Say what they handle." };

  const supabase = createAdminClient();
  const { count } = await supabase
    .from("sub_department_contacts")
    .select("id", { count: "exact", head: true })
    .eq("sub_department_id", subDepartmentId);

  const { error } = await supabase.from("sub_department_contacts").insert({
    sub_department_id: subDepartmentId,
    name,
    handles,
    sort_order: (count ?? 0) + 1,
  });
  if (error) return { error: `Could not save contact: ${error.message}` };

  revalidatePath(`/${departmentSlug}/${subDepartmentSlug}`);
  redirect(`/${departmentSlug}/${subDepartmentSlug}`);
}

export async function updateContact(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireUnlocked();

  const id = String(formData.get("id") ?? "");
  const departmentSlug = String(formData.get("department_slug") ?? "");
  const subDepartmentSlug = String(formData.get("sub_department_slug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const handles = String(formData.get("handles") ?? "").trim();

  if (!id) return { error: "Missing contact id." };
  if (!name) return { error: "Name is required." };
  if (!handles) return { error: "Say what they handle." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sub_department_contacts")
    .update({ name, handles })
    .eq("id", id);
  if (error) return { error: `Could not save contact: ${error.message}` };

  revalidatePath(`/${departmentSlug}/${subDepartmentSlug}`);
  redirect(`/${departmentSlug}/${subDepartmentSlug}`);
}

export async function deleteContact(formData: FormData): Promise<void> {
  await requireUnlocked();

  const id = String(formData.get("id") ?? "");
  const departmentSlug = String(formData.get("department_slug") ?? "");
  const subDepartmentSlug = String(formData.get("sub_department_slug") ?? "");
  if (!id) throw new Error("Missing contact id.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("sub_department_contacts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/${departmentSlug}/${subDepartmentSlug}`);
  redirect(`/${departmentSlug}/${subDepartmentSlug}`);
}

// ── Hacks ─────────────────────────────────────────────────────────────

export async function createHack(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireUnlocked();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const processId = String(formData.get("process_id") ?? "").trim();
  const authorName = String(formData.get("author_name") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (!description) return { error: "Description is required." };
  if (!authorName) return { error: "Enter your name so others know who added this." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("hacks").insert({
    title,
    description,
    process_id: processId || null,
    created_by: authorName,
  });
  if (error) return { error: `Could not save hack: ${error.message}` };

  revalidatePath("/hacks");
  redirect("/hacks");
}

export async function updateHack(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireUnlocked();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const processId = String(formData.get("process_id") ?? "").trim();

  if (!id) return { error: "Missing hack id." };
  if (!title) return { error: "Title is required." };
  if (!description) return { error: "Description is required." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("hacks")
    .update({ title, description, process_id: processId || null })
    .eq("id", id);
  if (error) return { error: `Could not save hack: ${error.message}` };

  revalidatePath("/hacks");
  redirect("/hacks");
}

export async function deleteHack(formData: FormData): Promise<void> {
  await requireUnlocked();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing hack id.");

  const supabase = createAdminClient();
  const { error } = await supabase.from("hacks").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/hacks");
  redirect("/hacks");
}

const HACK_STATUSES = ["proposed", "in_progress", "done"] as const;

/** Deliberately doesn't redirect — this backs an inline status dropdown that
 * can appear on the Hacks page or a department page's tracker widget, and
 * should just re-render wherever the user already is, not send them to
 * /hacks. Also skips ActionState/useActionState: there's no form-shaped
 * input to redisplay on error, just a dropdown that should stay put. */
export async function updateHackStatus(formData: FormData): Promise<void> {
  await requireUnlocked();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const departmentSlug = String(formData.get("department_slug") ?? "");

  if (!id) throw new Error("Missing hack id.");
  if (!HACK_STATUSES.includes(status as (typeof HACK_STATUSES)[number])) {
    throw new Error("Invalid status.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("hacks").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/hacks");
  if (departmentSlug) revalidatePath(`/${departmentSlug}`);
}

// ── Feedback ─────────────────────────────────────────────────────────
// Deliberately the one write action in this app with no requireUnlocked()
// call — feedback is meant to be open to anyone, not just people who know
// the passcode.

export type FeedbackState = { success: true } | { error: string } | null;

const FEEDBACK_MAX_LENGTH = 2000;

export async function submitFeedback(
  _prevState: FeedbackState,
  formData: FormData
): Promise<FeedbackState> {
  const message = String(formData.get("message") ?? "").trim();
  const pagePath = String(formData.get("page_path") ?? "").trim();

  if (!message) return { error: "Say something first." };
  if (message.length > FEEDBACK_MAX_LENGTH) {
    return { error: `Keep it under ${FEEDBACK_MAX_LENGTH} characters.` };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("feedback").insert({
    message,
    page_path: pagePath || null,
  });
  if (error) return { error: `Could not send feedback: ${error.message}` };

  return { success: true };
}
