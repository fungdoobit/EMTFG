import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProcessBySlug } from "@/lib/queries";
import { isUnlocked } from "@/lib/auth";
import { deleteProcess } from "@/lib/actions";
import { ProcessFlow } from "@/components/ProcessFlow";
import { HackCard } from "@/components/HackCard";
import { DeleteButton } from "@/components/DeleteButton";

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg)$/i;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ProcessPage({
  params,
}: PageProps<"/[deptSlug]/[subSlug]/[processSlug]">) {
  const { deptSlug, subSlug, processSlug } = await params;
  const process = await getProcessBySlug(deptSlug, subSlug, processSlug);
  if (!process) notFound();

  const unlocked = await isUnlocked();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted">
          <Link href="/" className="hover:text-foreground">
            Departments
          </Link>{" "}
          /{" "}
          <Link href={`/${deptSlug}`} className="hover:text-foreground">
            {process.department.name}
          </Link>{" "}
          /{" "}
          <Link href={`/${deptSlug}/${subSlug}`} className="hover:text-foreground">
            {process.sub_department.name}
          </Link>{" "}
          / {process.title}
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{process.title}</h1>
          {unlocked && (
            <div className="flex gap-2">
              <Link
                href={`/${deptSlug}/${subSlug}/${processSlug}/edit`}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:border-brand"
              >
                Edit
              </Link>
              <form action={deleteProcess}>
                <input type="hidden" name="id" value={process.id} />
                <input type="hidden" name="department_slug" value={deptSlug} />
                <input type="hidden" name="sub_department_slug" value={subSlug} />
                <DeleteButton confirmMessage={`Delete "${process.title}"? This can't be undone.`} />
              </form>
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">
          {process.created_by && <>Added by {process.created_by} on {formatDate(process.created_at)}</>}
          {process.updated_by && process.updated_at !== process.created_at && (
            <> · Last edited by {process.updated_by} on {formatDate(process.updated_at)}</>
          )}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Flow</h2>
        <div className="mt-3">
          <ProcessFlow steps={process.steps} />
        </div>
      </section>

      {process.notes && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Notes &amp; tips
          </h2>
          <p className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-surface p-4 text-sm text-foreground">
            {process.notes}
          </p>
        </section>
      )}

      {process.attachments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Attachments
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {process.attachments.map((attachment) =>
              IMAGE_EXTENSIONS.test(attachment.file_name) ? (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-lg border border-border"
                >
                  <Image
                    src={attachment.file_url}
                    alt={attachment.file_name}
                    width={160}
                    height={160}
                    className="h-40 w-40 object-cover"
                    unoptimized
                  />
                </a>
              ) : (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-brand hover:underline"
                >
                  📎 {attachment.file_name}
                </a>
              )
            )}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Hacks &amp; improvement ideas
          </h2>
          <Link
            href={`/hacks/new?process_id=${process.id}`}
            className="text-sm font-medium text-brand hover:underline"
          >
            + Suggest one
          </Link>
        </div>
        {process.hacks.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No hacks suggested for this process yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {process.hacks.map((hack) => (
              <HackCard key={hack.id} hack={hack} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
