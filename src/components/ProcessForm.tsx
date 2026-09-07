"use client";

import { useActionState, useState } from "react";
import { createProcess, updateProcess } from "@/lib/actions";
import type { ProcessAttachment, ProcessStep } from "@/lib/types";

type StepDraft = { key: number; title: string; description: string };

let nextKey = 0;
function toDraft(step?: Pick<ProcessStep, "title" | "description">): StepDraft {
  return { key: nextKey++, title: step?.title ?? "", description: step?.description ?? "" };
}

type Props =
  | {
      mode: "create";
      departmentSlug: string;
      subDepartmentSlug: string;
      subDepartmentId: string;
    }
  | {
      mode: "edit";
      departmentSlug: string;
      subDepartmentSlug: string;
      processSlug: string;
      processId: string;
      initialTitle: string;
      initialNotes: string;
      initialSteps: ProcessStep[];
      initialAttachments: ProcessAttachment[];
    };

export function ProcessForm(props: Props) {
  const action = props.mode === "create" ? createProcess : updateProcess;
  const [state, formAction, pending] = useActionState(action, null);
  const [steps, setSteps] = useState<StepDraft[]>(() =>
    props.mode === "edit" && props.initialSteps.length > 0
      ? props.initialSteps.map((s) => toDraft(s))
      : [toDraft()]
  );

  function updateStep(key: number, field: "title" | "description", value: string) {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, [field]: value } : s)));
  }

  function removeStep(key: number) {
    setSteps((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="department_slug" value={props.departmentSlug} />
      <input type="hidden" name="sub_department_slug" value={props.subDepartmentSlug} />
      {props.mode === "create" ? (
        <input type="hidden" name="sub_department_id" value={props.subDepartmentId} />
      ) : (
        <>
          <input type="hidden" name="id" value={props.processId} />
          <input type="hidden" name="process_slug" value={props.processSlug} />
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-foreground">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={props.mode === "edit" ? props.initialTitle : ""}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-foreground">Steps</label>
        {steps.map((step, i) => (
          <div key={step.key} className="flex gap-3 rounded-lg border border-border bg-surface p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-muted">
              {i + 1}
            </span>
            <div className="flex flex-1 flex-col gap-2">
              <input
                name="step_title"
                required
                placeholder="Step title"
                value={step.title}
                onChange={(e) => updateStep(step.key, "title", e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <textarea
                name="step_description"
                placeholder="Description (optional)"
                rows={2}
                value={step.description}
                onChange={(e) => updateStep(step.key, "description", e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <button
              type="button"
              onClick={() => removeStep(step.key)}
              disabled={steps.length === 1}
              className="h-7 shrink-0 text-sm text-muted hover:text-red-600 disabled:opacity-30"
              aria-label="Remove step"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSteps((prev) => [...prev, toDraft()])}
          className="self-start rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted hover:border-brand hover:text-brand"
        >
          + Add step
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-foreground">
          Notes &amp; tips <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={props.mode === "edit" ? props.initialNotes : ""}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          Attachments <span className="font-normal text-muted">(optional — screenshots, files)</span>
        </label>
        {props.mode === "edit" && props.initialAttachments.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {props.initialAttachments.map((attachment) => (
              <li key={attachment.id} className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" id={`remove-${attachment.id}`} name="remove_attachment" value={attachment.id} />
                <label htmlFor={`remove-${attachment.id}`}>
                  Remove <span className="text-foreground">{attachment.file_name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <input
          type="file"
          name="attachments"
          multiple
          className="text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-foreground"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="author_name" className="text-sm font-medium text-foreground">
          Your name
        </label>
        <input
          id="author_name"
          name="author_name"
          required
          placeholder="So others know who added/edited this"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand sm:w-64"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-60"
      >
        {pending ? "Saving…" : props.mode === "create" ? "Create process" : "Save changes"}
      </button>
    </form>
  );
}
