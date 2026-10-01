"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notes, NoteConflictError, NoteNotFoundError } from "@/lib/notes";
import { validateInput, type ActionState } from "@/lib/model";

// Read one string field from submitted FormData.
// Throw an error if the field is missing or is not a string.
function field(data: FormData, name: string): string {
  const value = data.get(name);

  if (typeof value !== "string") {
    throw new Error(`Missing ${name}.`)
  }

  return value;
}

// Refresh cached routes after notes are created, updated, or deleted.
function invalidate() {
  // Invalidate lists, tag counts, and previously visited client router entries.
  revalidatePath("/", "layout");
}

// Create a new note or update an existing note.
export async function saveNote(
  id: string | null,
  version: string | null,
  _state: ActionState,
  data: FormData
): Promise<ActionState> {
  let input;

  try {
    // Read submitted form fields and validate the note data.
    input = validateInput({
      title: field(data, "title"),
      body: field(data, "body"), 
      // Convert "tag1,tag2" into ["tag1", "tag2"].
      tags: field(data, "tags").split(",") 
    });
  } catch (error) { 
    // Return validation errors to the form.
    return {
      error: (error as Error).message
    }; 
  }

  let saved;

  try {
    if(id === null) {
      saved = await notes.create(input);
    } else {
      // Existing id means update the current note.
      saved = await notes.update(
        id,
        input,
        version ?? ""
      );
    }
  } catch (error) {
    // Handle expected note conflicts or missing notes.
    if (
      error instanceof NoteConflictError || 
      error instanceof NoteNotFoundError
    ) {
      return { 
        error: error.message 
      };
    }
    // Log unexpected server/filesystem errors.
    console.error("Unable to save note", error);

    return {
      error:
        "Unable to save the note. Check that the notes directory is writable and try again."
    };
  }

  // Refresh pages that depend on note data.
  invalidate();

  // Send the user to the saved note.
  // Keep redirect outside the try/catch because Next.js
  // uses an internal exception to perform redirects.
  redirect(`/notes/${saved.id}`);
}

// Delete an existing note.
export async function deleteNote(
  id: string,
  version: string,
  _state: ActionState,
  _data: FormData
): Promise<ActionState> {
  try {
    // Delete the note only if its version is still current.
    await notes.remove(id, version);
  } catch (error) {
    if (
      error instanceof NoteConflictError ||
      error instanceof NoteNotFoundError
    ) {
      return {
        error: error.message
      };
    }

    // Log unexpected server errors.
    console.error("Unable to delete note", error);

    return {
      error: "Unable to delete the note. Please try again."
    };
  }

  // Refresh note-dependent pages after deleting.
  invalidate();

  // Return the user to the home page.
  redirect("/");
}
