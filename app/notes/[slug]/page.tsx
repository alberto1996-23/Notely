import Link from "next/link";
import { notFound } from "next/navigation";
import { notes } from "@/lib/notes";
import { renderMarkdown } from "@/lib/markdown";
import { DeleteNote } from "@/components/delete-note";

// Pre-render existing notes; new slugs are generated on demand. Revalidation
// also picks up edits made directly to files, without requiring another build.
export const revalidate = 60;
export const dynamicParams = true;
export async function generateStaticParams() {
  return (await notes.list()).map((note) => ({ slug: note.id }));
}
export default async function ReadNote({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await notes.get(slug);
  if (!note) notFound();
  return <article>
    <div className="heading"><h1>{note.title}</h1><Link className="button" href={`/notes/${note.id}/edit`}>Edit note</Link></div>
    <p className="muted">Created <time dateTime={note.createdAt}>{note.createdAt.slice(0, 10)}</time> · Updated <time dateTime={note.updatedAt}>{note.updatedAt.slice(0, 10)}</time></p>
    <div className="tags">{note.tags.map((tag) => <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`}>#{tag}</Link>)}</div>
    <div className="markdown read-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.body) }} />
    <DeleteNote id={note.id} version={note.updatedAt} />
  </article>;
}
