import { NoteEditor } from "@/components/note-editor";
// Sets the browser/tab title for the /notes/new page.
export const metadata = { title: "New note" };

export default function NewNote() { 
    return (
    <>
        {/* Page heading */}
        <h1>New note</h1>

        {/* Displays the interactive form for creating a note */}
        <NoteEditor />
    </>); 
}
