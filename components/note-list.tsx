import Link from "next/link";

import type { Note } from "@/lib/model";

export function NoteList({
  notes,
}: {
  notes: Note[];
}) {
  return (
    <section aria-label="Notes">
      {/* Show the total number of matching notes. */}
      <p>
        {notes.length}{" "}
        {notes.length === 1 ? "note" : "notes"}
      </p>

      {notes.length > 0 ? (
        // Render one list item for each note.
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note.id}>
              {/* Link to the full note page. */}
              <h2>
                <Link href={`/notes/${note.id}`}>
                  {note.title}
                </Link>
              </h2>

              {/* Show the first 180 characters of the note body.
                  Use fallback text if the note body is empty. */}
              <p className="excerpt">
                {note.body.slice(0, 180) || "No content yet."}

                {/* Add an ellipsis only when the body was shortened. */}
                {note.body.length > 180 ? "…" : ""}
              </p>

              {/* Display each tag as a link to its tag page. */}
              <div className="tags">
                {note.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                  >
                    #{tag}
                  </Link>
                ))}
              </div>

              {/* Show a shortened version of the last-updated date. */}
              <small>
                Updated{" "}
                <time dateTime={note.updatedAt}>
                  {note.updatedAt.slice(0, 10)}
                </time>
              </small>
            </li>
          ))}
        </ul>
      ) : (
        // Show this when search/tag filters return no notes.
        <p>
          No notes match. Clear the filters or{" "}
          <Link href="/notes/new">
            create a note
          </Link>.
        </p>
      )}
    </section>
  );
}