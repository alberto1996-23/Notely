import Link from "next/link";
import type { Note } from "@/lib/model";

export function NoteList({ notes }: { notes: Note[] }) {
  return <section aria-label="Notes">
    <p>{notes.length} {notes.length === 1 ? "note" : "notes"}</p>
    {notes.length ? <ul className="note-list">{notes.map((note) => <li key={note.id}>
      <h2><Link href={`/notes/${note.id}`}>{note.title}</Link></h2>
      <p className="excerpt">{note.body.slice(0, 180) || "No content yet."}{note.body.length > 180 ? "…" : ""}</p>
      <div className="tags">{note.tags.map((tag) => <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>#{tag}</Link>)}</div>
      <small>Updated <time dateTime={note.updatedAt}>{note.updatedAt.slice(0, 10)}</time></small>
    </li>)}</ul> : <p>No notes match. Clear the filters or <Link href="/notes/new">create a note</Link>.</p>}
  </section>;
}
