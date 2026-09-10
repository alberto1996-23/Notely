import { notFound } from "next/navigation";
import { notes } from "@/lib/notes";
import { NoteEditor } from "@/components/note-editor";

// Editing always needs the latest file and revision, never a cached draft.
export const dynamic = "force-dynamic";
export const metadata = { title: "Edit note" };
export default async function EditNote({ params }: { params: Promise<{ slug: string }> }) {
  const note = await notes.get((await params).slug);
  if (!note) notFound();
  return <><h1>Edit note</h1><NoteEditor key={`${note.id}:${note.updatedAt}`} note={note} /></>;
}
