import Link from "next/link";
import { notes } from "@/lib/notes";
import { tagCounts } from "@/lib/model";

// Always calculate tags from the latest saved notes.
export const dynamic = "force-dynamic";
// Sets the browser/tab title for the /tags page.
export const metadata = { title: "Tags" };

export default async function Tags() {
  // Load all notes, then count how many notes use each tag.
  const allNotes = await notes.list();
  const tags = tagCounts(allNotes);

  return (
    <>
      <h1>Tags</h1>
      
      {/* If tags exist, display each tag and its note count. */}
      {tags.length > 0 ? (
        <ul className="note-list">
          {tags.map(([tag, count]) => (
            <li key={tag}>
              {/* Link to the page showing notes with this tag. */}
              <Link href={`/tags/${encodeURIComponent(tag)}`}>
                #{tag}
              </Link>{" "} 
              
              {/* Use singular "note" only when the count is 1. */}
              <span className="muted">
                {count} {count === 1 ? "note" : "notes"}
              </span>
            </li>
          ))}
        </ul> 
      ) : (
        // Show this when no notes currently contain tags.
        <p>No tags yet. Add tags while editing a note.</p>
      )}
    </>
  );
}
