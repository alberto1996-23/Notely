import type { Note } from "./model.ts";
import { validateInput } from "./model.ts";

// Only these metadata fields are allowed in note frontmatter.
const keys = [
  "id",
  "title",
  "tags",
  "createdAt",
  "updatedAt",
] as const;

// Convert a Note object into a markdown file string.
// JSON values are used because they are also valid YAML syntax,
// which avoids needing a full YAML library.
export function serializeNote(note: Note): string {
  const metadata = keys
    .map((key) => {
      return `${key}: ${JSON.stringify(note[key])}`;
    })
    .join("\n");

  return `---\n${metadata}\n---\n${note.body}`;
}

// Convert markdown file text back into a validated Note object.
export function parseNote(
  source: string,
  expectedId: string
): Note {
  // Match the frontmatter block at the beginning of the file.
  const match =
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(source);

  if (!match) {
    throw new Error(
      `Invalid frontmatter in ${expectedId}.md.`
    );
  }

  // Store metadata here until all fields have been validated.
  const metadata: Record<string, unknown> = {};

  // Parse each frontmatter line individually.
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    const key = line.slice(0, separator);

    // Reject missing separators, unknown fields, or duplicate fields.
    if (
      separator < 0 ||
      !keys.some((allowed) => allowed === key) ||
      Object.hasOwn(metadata, key)
    ) {
      throw new Error(
        `Invalid metadata field in ${expectedId}.md.`
      );
    }

    // Parse the value after the colon as JSON.
    metadata[key] = JSON.parse(
      line.slice(separator + 1).trim()
    );
  }

  // Confirm that every metadata value has the expected type
  // and that the stored id matches the filename/id being loaded.
  if (
    metadata.id !== expectedId ||
    typeof metadata.title !== "string" ||
    !Array.isArray(metadata.tags) ||
    !metadata.tags.every(
      (tag) => typeof tag === "string"
    ) ||
    typeof metadata.createdAt !== "string" ||
    !Number.isFinite(
      Date.parse(metadata.createdAt)
    ) ||
    typeof metadata.updatedAt !== "string" ||
    !Number.isFinite(
      Date.parse(metadata.updatedAt)
    )
  ) {
    throw new Error(
      `Invalid note metadata in ${expectedId}.md.`
    );
  }

  // Everything after the frontmatter is the Markdown body.
  // Validate the body, title, and tags using the same rules
  // used when saving notes from the editor.
  const input = validateInput({
    title: metadata.title,
    tags: metadata.tags,
    body: source.slice(match[0].length),
  });

  // Rebuild and return the complete Note object.
  return {
    ...input,
    id: expectedId,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  };
}
