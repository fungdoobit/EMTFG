"use client";

import type { HackStatus } from "@/lib/types";
import { updateHackStatus } from "@/lib/actions";

const STATUS_LABEL: Record<HackStatus, string> = {
  proposed: "Proposed",
  in_progress: "In Progress",
  done: "Done",
};

const STATUS_CLASS: Record<HackStatus, string> = {
  proposed: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  done: "bg-green-100 text-green-800 border-green-200",
};

export function HackStatusBadge({ status }: { status: HackStatus }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Same visual as the badge, but an actual <select> that saves on change —
 * only rendered when unlocked. One control does both display and edit so
 * there's no separate "now click edit to change status" step. */
export function HackStatusControl({
  hackId,
  status,
  departmentSlug,
}: {
  hackId: string;
  status: HackStatus;
  departmentSlug?: string;
}) {
  return (
    <form action={updateHackStatus}>
      <input type="hidden" name="id" value={hackId} />
      {departmentSlug && <input type="hidden" name="department_slug" value={departmentSlug} />}
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`shrink-0 cursor-pointer rounded-full border px-2 py-0.5 text-xs font-medium transition-transform hover:scale-105 ${STATUS_CLASS[status]}`}
      >
        {(Object.keys(STATUS_LABEL) as HackStatus[]).map((value) => (
          <option key={value} value={value}>
            {STATUS_LABEL[value]}
          </option>
        ))}
      </select>
    </form>
  );
}
