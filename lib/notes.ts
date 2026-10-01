import { constants } from "node:fs";

import {
  mkdir,
  open,
  readdir,
  rename,
  unlink,
} from "node:fs/promises";

import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  parseNote,
  serializeNote,
} from "./frontmatter.ts";

import {
  validateInput,
  type Note,
  type NoteInput,
} from "./model.ts";

// Specific errors that server actions can handle separately.
export class NoteNotFoundError extends Error {}
export class NoteConflictError extends Error {}

// Note IDs must be lowercase URL-safe slugs.
const validSlug =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Check whether a filesystem error means a file is missing.
const isMissing = (error: unknown) =>
  (error as NodeJS.ErrnoException).code === "ENOENT";

// Create a note-storage object for a specific directory.
// Tests can use temporary directories while the real app
// uses the project's notes/ directory.
export function createNoteStore(
  directory: string
) {
  // Queue write operations so they happen one at a time.
  let queue: Promise<unknown> = Promise.resolve();

  function exclusive<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const result = queue.then(operation);

    // Keep the queue usable even if one operation fails.
    queue = result.catch(() => undefined);

    return result;
  }

  // Convert a safe note id into its .md file path.
  function filename(id: string): string {
    if (
      id.length > 160 ||
      !validSlug.test(id) ||
      id === "new"
    ) {
      throw new NoteNotFoundError(
        "Note not found."
      );
    }

    return path.join(
      directory,
      `${id}.md`
    );
  }

  // Load and parse one note.
  async function get(
    id: string
  ): Promise<Note | null> {
    let file: string;

    try {
      file = filename(id);
    } catch (error) {
      // Invalid ids behave like missing notes.
      if (error instanceof NoteNotFoundError) {
        return null;
      }

      throw error;
    }

    try {
      // Open read-only and refuse symbolic links so a
      // note cannot point outside the notes directory.
      const handle = await open(
        file,
        constants.O_RDONLY |
          constants.O_NOFOLLOW
      );

      try {
        // Convert the file text into a validated Note object.
        return parseNote(
          await handle.readFile("utf8"),
          id
        );
      } finally {
        await handle.close();
      }
    } catch (error) {
      // Missing file means the note does not exist.
      if (isMissing(error)) {
        return null;
      }

      throw error;
    }
  }

  // Load every markdown note from the notes directory.
  async function list(): Promise<Note[]> {
    // Create the directory if it does not exist yet.
    await mkdir(directory, {
      recursive: true,
    });

    const entries = await readdir(
      directory,
      { withFileTypes: true }
    );

    // Keep only .md files and load them as notes.
    const notes = await Promise.all(
      entries
        .filter(
          (entry) =>
            entry.isFile() &&
            entry.name.endsWith(".md")
        )
        .map((entry) =>
          get(entry.name.slice(0, -3))
        )
    );

    // Remove missing notes and sort newest updates first.
    return notes
      .filter(
        (note): note is Note =>
          note !== null
      )
      .sort(
        (a, b) =>
          b.updatedAt.localeCompare(
            a.updatedAt
          ) ||
          a.id.localeCompare(b.id)
      );
  }

  // Safely write a complete Note object to disk.
  async function write(
    note: Note
  ) {
    await mkdir(directory, {
      recursive: true,
    });

    // Write to a unique temporary file first.
    const temporary = path.join(
      directory,
      `.${note.id}.${randomUUID()}.tmp`
    );

    try {
      // Create a new temp file with private permissions.
      const handle = await open(
        temporary,
        "wx",
        0o600
      );

      try {
        // Convert the Note into frontmatter + Markdown.
        await handle.writeFile(
          serializeNote(note),
          "utf8"
        );

        // Flush the completed file before replacing the old one.
        await handle.sync();
      } finally {
        await handle.close();
      }

      // Atomically replace the old note with the completed file.
      await rename(
        temporary,
        filename(note.id)
      );
    } finally {
      // Clean up the temp file if anything failed.
      await unlink(temporary).catch(
        (error) => {
          if (!isMissing(error)) {
            throw error;
          }
        }
      );
    }
  }

  return {
    get,
    list,

    // Create and save a new note.
    create(
      input: NoteInput
    ): Promise<Note> {
      return exclusive(async () => {
        const valid =
          validateInput(input);

        // Turn the title into a URL-safe slug base.
        const base =
          valid.title
            .toLowerCase()
            .normalize("NFKD")
            .replace(
              /[\u0300-\u036f]/g,
              ""
            )
            .replace(
              /[^a-z0-9]+/g,
              "-"
            )
            .replace(
              /^-|-$/g,
              ""
            )
            .slice(0, 80)
            .replace(/-$/, "") ||
          "note";

        // Add a UUID so note ids remain unique.
        const id =
          `${base}-${randomUUID()}`;

        const now =
          new Date().toISOString();

        const note: Note = {
          ...valid,
          id,
          createdAt: now,
          updatedAt: now,
        };

        await write(note);

        return note;
      });
    },

    // Update an existing note only if the caller's
    // version still matches the current file.
    update(
      id: string,
      input: NoteInput,
      expectedUpdatedAt: string
    ): Promise<Note> {
      return exclusive(async () => {
        const valid =
          validateInput(input);

        const previous =
          await get(id);

        if (!previous) {
          throw new NoteNotFoundError(
            "This note no longer exists."
          );
        }

        // Prevent an older editor tab from overwriting
        // a newer saved version of the note.
        if (
          previous.updatedAt !==
          expectedUpdatedAt
        ) {
          throw new NoteConflictError(
            "This note changed in another tab. Copy your draft, then reload before saving."
          );
        }

        // Ensure the new timestamp is always later.
        const updatedAt =
          new Date(
            Math.max(
              Date.now(),
              Date.parse(
                previous.updatedAt
              ) + 1
            )
          ).toISOString();

        // Preserve id/createdAt, replace editable fields,
        // and assign the new update timestamp.
        const note = {
          ...previous,
          ...valid,
          updatedAt,
        };

        await write(note);

        return note;
      });
    },

    // Delete a note only if the caller still has
    // the latest version.
    remove(
      id: string,
      expectedUpdatedAt: string
    ): Promise<void> {
      return exclusive(async () => {
        const previous =
          await get(id);

        if (!previous) {
          throw new NoteNotFoundError(
            "This note no longer exists."
          );
        }

        // Prevent deleting a note that changed
        // after the page was loaded.
        if (
          previous.updatedAt !==
          expectedUpdatedAt
        ) {
          throw new NoteConflictError(
            "This note changed. Reload before deleting it."
          );
        }

        // Delete the markdown file.
        await unlink(
          filename(id)
        );
      });
    },
  };
}

// Real store used by the application.
// Notes are saved inside the project's notes/ directory.
export const notes =
  createNoteStore(
    path.join(
      process.cwd(),
      "notes"
    )
  );