import Link from "next/link";
import { Suspense } from "react";
import { isUnlocked } from "@/lib/auth";
import { SearchBar } from "@/components/SearchBar";
import { UnlockControl } from "@/components/UnlockControl";

export async function Header() {
  const unlocked = await isUnlocked();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold text-foreground">
            EMT Hub
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted sm:hidden">
            <Link href="/hacks" className="hover:text-foreground">
              Hacks
            </Link>
            <Link href="/glossary" className="hover:text-foreground">
              Glossary
            </Link>
          </nav>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <nav className="hidden items-center gap-4 text-sm text-muted sm:flex">
            <Link href="/hacks" className="hover:text-foreground">
              Hacks
            </Link>
            <Link href="/glossary" className="hover:text-foreground">
              Glossary
            </Link>
          </nav>
          <Suspense fallback={<div className="h-8 w-full max-w-sm" />}>
            <SearchBar />
          </Suspense>
          <UnlockControl initiallyUnlocked={unlocked} />
        </div>
      </div>
    </header>
  );
}
