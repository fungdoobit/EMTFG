"use client";

import { useActionState } from "react";
import { createSubDepartment } from "@/lib/actions";

export function SubDepartmentForm({
  departmentSlug,
  departmentId,
}: {
  departmentSlug: string;
  departmentId: string;
}) {
  const [state, formAction, pending] = useActionState(createSubDepartment, null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="department_slug" value={departmentSlug} />
      <input type="hidden" name="department_id" value={departmentId} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="e.g. PHE, T12W, or a full name"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tools_systems" className="text-sm font-medium text-foreground">
          Tools &amp; systems <span className="font-normal text-muted">(optional, comma-separated)</span>
        </label>
        <input
          id="tools_systems"
          name="tools_systems"
          placeholder="e.g. Excel, Autocount, SharePoint"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="general_note" className="text-sm font-medium text-foreground">
          General note <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="general_note"
          name="general_note"
          rows={3}
          placeholder="Anything worth flagging across every process here — shared risks, quirks, etc."
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-60"
      >
        {pending ? "Saving…" : "Create sub-department"}
      </button>
    </form>
  );
}
