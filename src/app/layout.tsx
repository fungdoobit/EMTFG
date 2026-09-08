import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { PageTransition } from "@/components/PageTransition";
import { AmbientBackground } from "@/components/AmbientBackground";
import { CustomCursor } from "@/components/CustomCursor";
import "./globals.css";

export const metadata: Metadata = {
  title: "EMT Hub",
  description: "Department processes, tutorials, and improvement ideas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col antialiased">
        <AmbientBackground />
        <CustomCursor />
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">
          <PageTransition>{children}</PageTransition>
        </main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted">
          EMT Hub — internal knowledge base
        </footer>
      </body>
    </html>
  );
}
