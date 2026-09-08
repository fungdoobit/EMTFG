import { getFeedbackList } from "@/lib/queries";
import { isFeedbackUnlocked } from "@/lib/auth";
import { lockFeedback } from "@/lib/actions";
import { FeedbackUnlockForm } from "@/components/FeedbackUnlockForm";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function FeedbackPage() {
  const unlocked = await isFeedbackUnlocked();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Feedback</h1>
          <p className="mt-1 text-sm text-muted">
            Everything submitted through the &ldquo;Feedback&rdquo; box in the side menu.
          </p>
        </div>
        {unlocked && (
          <form action={lockFeedback}>
            <button
              type="submit"
              className="whitespace-nowrap rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-all hover:border-foreground/30 hover:text-foreground active:scale-95"
            >
              Lock feedback view
            </button>
          </form>
        )}
      </div>

      {!unlocked ? <FeedbackUnlockForm /> : <FeedbackList />}
    </div>
  );
}

async function FeedbackList() {
  const feedback = await getFeedbackList();

  if (feedback.length === 0) {
    return <p className="text-sm text-muted">No feedback submitted yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface shadow-elevated">
      {feedback.map((item) => (
        <li key={item.id} className="flex flex-col gap-1 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm text-foreground">{item.message}</p>
          <p className="text-xs text-muted">
            {formatDateTime(item.created_at)}
            {item.page_path && <> · from {item.page_path}</>}
          </p>
        </li>
      ))}
    </ul>
  );
}
