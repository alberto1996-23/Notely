import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Notely", template: "%s | Notely" }, description: "Write, find, and organize your markdown notes." };
export const runtime = "nodejs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <a className="skip-link" href="#main">Skip to content</a>
    <header><Link className="brand" href="/">Notely</Link><nav aria-label="Main navigation">
      <Link href="/">All notes</Link><Link href="/tags">Tags</Link><Link href="/notes/new">New note</Link>
    </nav></header>
    <main id="main">{children}</main>
  </body></html>;
}
