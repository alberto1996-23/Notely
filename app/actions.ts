"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notes, NoteConflictError, NoteNotFoundError } from "@/lib/notes";
import { validateInput, type ActionState } from "@/lib/model";

function field(data: FormData, name: string): string {
  const value = data.get(name);
  if (typeof value !== "string") throw new Error(`Missing ${name}.`);
  return value;
}
function invalidate() {
  // Invalidate lists, tag counts, and previously visited client router entries.
  revalidatePath("/", "layout");
}

export async function saveNote(id: string | null, version: string | null, _state: ActionState, data: FormData): Promise<ActionState> {
  let input;
  try {
    input = validateInput({ title: field(data, "title"), body: field(data, "body"), tags: field(data, "tags").split(",") });
  } catch (error) { return { error: (error as Error).message }; }
  let saved;
  try {
    saved = id === null ? await notes.create(input) : await notes.update(id, input, version ?? "");
  } catch (error) {
    if (error instanceof NoteConflictError || error instanceof NoteNotFoundError) return { error: error.message };
    console.error("Unable to save note", error);
    return { error: "Unable to save the note. Check that the notes directory is writable and try again." };
  }
  invalidate();
  // redirect throws an internal control-flow exception; keep it outside catch.
  redirect(`/notes/${saved.id}`);
}

export async function deleteNote(id: string, version: string, _state: ActionState, _data: FormData): Promise<ActionState> {
  try { await notes.remove(id, version); }
  catch (error) {
    if (error instanceof NoteConflictError || error instanceof NoteNotFoundError) return { error: error.message };
    console.error("Unable to delete note", error);
    return { error: "Unable to delete the note. Please try again." };
  }
  invalidate();
  redirect("/");
}
