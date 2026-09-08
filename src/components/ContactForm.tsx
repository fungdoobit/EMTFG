"use client";

import { useActionState } from "react";
import { createContact, updateContact } from "@/lib/actions";

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
      contactId: string;
      initialName: string;
      initialHandles: string;
    };

export function ContactForm(props: Props) {
  const action = props.mode === "create" ? createContact : updateContact;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="department_slug" value={props.departmentSlug} />
      <input type="hidden" name="sub_department_slug" value={props.subDepartmentSlug} />
      {props.mode === "create" ? (
        <input type="hidden" name="sub_department_id" value={props.subDepartmentId} />
      ) : (
        <input type="hidden" name="id" value={props.contactId} />
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={props.mode === "edit" ? props.initialName : ""}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand sm:w-64"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="handles" className="text-sm font-medium text-foreground">
          What they handle
        </label>
        <textarea
          id="handles"
          name="handles"
          required
          rows={2}
          placeholder="e.g. Penang Port invoices, Maersk local charges"
          defaultValue={props.mode === "edit" ? props.initialHandles : ""}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-60"
      >
        {pending ? "Saving…" : props.mode === "create" ? "Add contact" : "Save changes"}
      </button>
    </form>
  );
}
