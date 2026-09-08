/** Purely decorative: two soft, blurred color blobs that drift slowly behind
 * the page content, giving a sense of depth without any 3D/WebGL engine.
 * Fixed + pointer-events-none so it never affects layout or interaction;
 * negative z-index keeps it below every real element. Frozen in place under
 * prefers-reduced-motion via the global rule in globals.css. */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-float-a absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand/15 blur-3xl" />
      <div className="animate-float-b absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-accent/12 blur-3xl" />
      <div className="animate-float-a absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand/10 blur-3xl [animation-delay:-8s]" />
    </div>
  );
}
