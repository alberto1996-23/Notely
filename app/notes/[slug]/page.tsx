import Link from "next/link";
import { notFound } from "next/navigation";
import { notes } from "@/lib/notes";
import { renderMarkdown } from "@/lib/markdown";
import { DeleteNote } from "@/components/delete-note";

// Allow cached note pages to be regenerated after 60 seconds.
// This helps pick up changes made directly to markdown files.
export const revalidate = 60;
// Allow note URLs that were not known when the app was built.
export const dynamicParams = true;
// Tell Next.js which existing note routes can be pre-rendered.
export async function generateStaticParams() {
  const allNotes = await notes.list();

  return allNotes.map((note) => ({ 
    slug: note.id 
  }));
}

export default async function ReadNote({ 
  params,
}: { 
    params: Promise<{ slug: string }> 
}) {
  // Get the dynamic slug from a URL like /notes/my-note.
  const { slug } = await params;
  // Load the matching note from the filesystem.
  const note = await notes.get(slug);

  // Show the application's 404 page if the note does not exist.
  if (!note) {
    notFound();
  }

  return (
    <article>
      <div className="heading">
        {/* Display the saved note title. */}
        <h1>{note.title}</h1>
        
        {/* Link to this note's edit page. */}
        <Link 
          className="button"
          href={`/notes/${note.id}/edit`}
        >
          Edit note
        </Link>
      </div>

      {/* Show shortened creation/update dates while preserving
          the full timestamp in the HTML dateTime attribute. */}
      <p className="muted">
        Created{" "}
        <time dateTime={note.createdAt}>
          {note.createdAt.slice(0, 10)}
        </time>
        {" . "}
        Updated{" "}
        <time dateTime={note.updatedAt}>
          {note.updatedAt.slice(0, 10)}
        </time>
      </p>

      {/* Turn each tag into a link to its tag-filtered page. */}
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

      {/* Convert the note's Markdown body into sanitized HTML
          and render the formatted result. */}
      <div 
        className="markdown read-body"
        dangerouslySetInnerHTML={{
          __html: renderMarkdown(note.body)
        }}
      />

      {/* Delete this note while passing its current version
          for stale-update/conflict protection. */}
      <DeleteNote
        id={note.id} 
        version={note.updatedAt}
      />
    </article>
  );
}
