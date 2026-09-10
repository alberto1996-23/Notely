import { constants } from "node:fs";
import { mkdir, open, readdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseNote, serializeNote } from "./frontmatter.ts";
import { validateInput, type Note, type NoteInput } from "./model.ts";

export class NoteNotFoundError extends Error {}
export class NoteConflictError extends Error {}
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isMissing = (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT";

// The factory lets tests use disposable directories. Application routes use the
// singleton below; this module is imported only by Server Components/Actions.
export function createNoteStore(directory: string) {
  let queue: Promise<unknown> = Promise.resolve();
  function exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation);
    queue = result.catch(() => undefined);
    return result;
  }
  function filename(id: string): string {
    if (id.length > 160 || !validSlug.test(id) || id === "new") throw new NoteNotFoundError("Note not found.");
    return path.join(directory, `${id}.md`);
  }
  async function get(id: string): Promise<Note | null> {
    let file: string;
    try { file = filename(id); } catch (error) {
      if (error instanceof NoteNotFoundError) return null;
      throw error;
    }
    try {
      // Refuse symlinks so a note cannot read a file outside the notes directory.
      // Files live on the runtime disk; do not trace arbitrary project files into builds.
      const handle = await open(/* turbopackIgnore: true */ file, constants.O_RDONLY | constants.O_NOFOLLOW);
      try { return parseNote(await handle.readFile("utf8"), id); }
      finally { await handle.close(); }
    } catch (error) { if (isMissing(error)) return null; throw error; }
  }
  async function list(): Promise<Note[]> {
    await mkdir(directory, { recursive: true });
    const entries = await readdir(directory, { withFileTypes: true });
    const notes = await Promise.all(entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => get(entry.name.slice(0, -3))));
    return notes.filter((note): note is Note => note !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  }
  async function write(note: Note) {
    await mkdir(directory, { recursive: true });
    const temporary = path.join(directory, `.${note.id}.${randomUUID()}.tmp`);
    try {
      const handle = await open(temporary, "wx", 0o600);
      try { await handle.writeFile(serializeNote(note), "utf8"); await handle.sync(); }
      finally { await handle.close(); }
      // Readers see either the complete old file or the complete new file.
      await rename(temporary, filename(note.id));
    } finally { await unlink(temporary).catch((error) => { if (!isMissing(error)) throw error; }); }
  }
  return {
    get, list,
    create(input: NoteInput): Promise<Note> {
      return exclusive(async () => {
        const valid = validateInput(input);
        const base = valid.title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80).replace(/-$/, "") || "note";
        const id = `${base}-${randomUUID()}`;
        const now = new Date().toISOString();
        const note: Note = { ...valid, id, createdAt: now, updatedAt: now };
        await write(note);
        return note;
      });
    },
    update(id: string, input: NoteInput, expectedUpdatedAt: string): Promise<Note> {
      return exclusive(async () => {
        const valid = validateInput(input);
        const previous = await get(id);
        if (!previous) throw new NoteNotFoundError("This note no longer exists.");
        if (previous.updatedAt !== expectedUpdatedAt) throw new NoteConflictError("This note changed in another tab. Copy your draft, then reload before saving.");
        const updatedAt = new Date(Math.max(Date.now(), Date.parse(previous.updatedAt) + 1)).toISOString();
        const note = { ...previous, ...valid, updatedAt };
        await write(note);
        return note;
      });
    },
    remove(id: string, expectedUpdatedAt: string): Promise<void> {
      return exclusive(async () => {
        const previous = await get(id);
        if (!previous) throw new NoteNotFoundError("This note no longer exists.");
        if (previous.updatedAt !== expectedUpdatedAt) throw new NoteConflictError("This note changed. Reload before deleting it.");
        await unlink(filename(id));
      });
    },
  };
}

export const notes = createNoteStore(path.join(process.cwd(), "notes"));
