"use client";

import { useActionState } from "react";
import { createHack, updateHack } from "@/lib/actions";
import type { ProcessOption } from "@/lib/types";

type Props =
  | {
      mode: "create";
      processOptions: ProcessOption[];
      initialProcessId?: string;
    }
  | {
      mode: "edit";
      processOptions: ProcessOption[];
      hackId: string;
      initialTitle: string;
      initialDescription: string;
      initialProcessId: string;
    };

export function HackForm(props: Props) {
  const action = props.mode === "create" ? createHack : updateHack;
  const [state, formAction, pending] = useActionState(action, null);

  const grouped = new Map<string, ProcessOption[]>();
  for (const option of props.processOptions) {
    const list = grouped.get(option.sub_department_name) ?? [];
    list.push(option);
    grouped.set(option.sub_department_name, list);
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {props.mode === "edit" && <input type="hidden" name="id" value={props.hackId} />}

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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={props.mode === "edit" ? props.initialDescription : ""}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="process_id" className="text-sm font-medium text-foreground">
          Related process <span className="font-normal text-muted">(optional)</span>
        </label>
        <select
          id="process_id"
          name="process_id"
          defaultValue={
            props.mode === "edit" ? props.initialProcessId : props.initialProcessId ?? ""
          }
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">— No process (standalone idea) —</option>
          {[...grouped.entries()].map(([subDeptName, options]) => (
            <optgroup key={subDeptName} label={subDeptName}>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {props.mode === "create" && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="author_name" className="text-sm font-medium text-foreground">
            Your name
          </label>
          <input
            id="author_name"
            name="author_name"
            required
            placeholder="So others know who suggested this"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand sm:w-64"
          />
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-60"
      >
        {pending ? "Saving…" : props.mode === "create" ? "Add hack" : "Save changes"}
      </button>
    </form>
  );
}
