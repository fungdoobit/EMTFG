"use client";

export function DeleteButton({ confirmMessage }: { confirmMessage: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
      className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
    >
      Delete
    </button>
  );
}
