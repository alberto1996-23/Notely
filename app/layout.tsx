import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

// Default metadata used across the entire application.
export const metadata: Metadata = {
  title: {
    // Used when a page does not define its own title.
    default: "Notely",
    
    // Child page titles become something like "Tags | Notely".
    template: "%s | Notely" 
  },
  
  description: "Write, find, and organize your markdown notes."
};

// Use Node.js because Notely reads and writes note files
// using the server filesystem.
export const runtime = "nodejs";

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Accessibility link that lets keyboard users
            jump directly to the main page content. */}
        <a
          className="skip-link"
          href="#main"
        >
          Skip to content
        </a>

        {/* Shared site header shown on every page. */}
        <header>
          {/* Clicking the app name returns to the home page. */}
          <Link
            className="brand"
            href="/"
          >
            Notely
          </Link>
          
          {/* Main navigation for the application. */}
          <nav aria-label="Main navigation">
            <Link href="/">
              All notes
            </Link>
            
            <Link href="/tags">
              Tags
            </Link>
            
            <Link href="/notes/new">
              New note
            </Link>
          </nav>
        </header>
        
        {/* The currently selected page is rendered here. */}
        <main id="main">
          {children}
        </main>
      </body>
    </html>
  );
}
