import { notFound } from "next/navigation";
import { notes } from "@/lib/notes";
import { NoteEditor } from "@/components/note-editor";

// Always load the newest version of a note when editing.
// This prevents the editor from using stale cached data.
export const dynamic = "force-dynamic";
// Sets the browser/tab title for this route.
export const metadata = { title: "Edit note" };

export default async function EditNote({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Get the dynamic slug from a URL like /notes/my-note/edit.
  const { slug } = await params;
  // Load the latest version of the note from the filesystem.
  const note = await notes.get(slug);

  // Show the application's 404 page if the note does not exist.
  if (!note){
    notFound();
  }

  return (
    <>
      <h1>Edit note</h1>
      
      {/* Pass the existing note into the editor so its fields are
          pre-filled. Changing updatedAt changes the key, causing
          React to recreate the editor with the newest note data. */}
      <NoteEditor
        key={`${note.id}:${note.updatedAt}`}
        note={note} 
      />
    </>
  );
}
