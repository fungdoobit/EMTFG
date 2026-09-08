"use client";

import { usePathname } from "next/navigation";

/** Keying on pathname forces this wrapper to remount on every navigation,
 * which is what replays the CSS fade-in — a plain wrapping div would stay
 * mounted across client-side transitions and only animate once, on the
 * very first page load. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  );
}
