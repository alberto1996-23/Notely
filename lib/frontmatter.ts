import type { Note } from "./model.ts";
import { validateInput } from "./model.ts";

const keys = ["id", "title", "tags", "createdAt", "updatedAt"] as const;

// JSON strings and flow arrays are valid YAML. Supporting this deliberately small
// subset avoids a third runtime library and YAML's implicit date/type coercion.
export function serializeNote(note: Note): string {
  return `---\n${keys.map((key) => `${key}: ${JSON.stringify(note[key])}`).join("\n")}\n---\n${note.body}`;
}

export function parseNote(source: string, expectedId: string): Note {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(source);
  if (!match) throw new Error(`Invalid frontmatter in ${expectedId}.md.`);
  const metadata: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    const key = line.slice(0, separator);
    if (separator < 0 || !keys.some((allowed) => allowed === key) || Object.hasOwn(metadata, key)) {
      throw new Error(`Invalid metadata field in ${expectedId}.md.`);
    }
    metadata[key] = JSON.parse(line.slice(separator + 1).trim());
  }
  if (metadata.id !== expectedId || typeof metadata.title !== "string" ||
      !Array.isArray(metadata.tags) || !metadata.tags.every((tag) => typeof tag === "string") ||
      typeof metadata.createdAt !== "string" || !Number.isFinite(Date.parse(metadata.createdAt)) ||
      typeof metadata.updatedAt !== "string" || !Number.isFinite(Date.parse(metadata.updatedAt))) {
    throw new Error(`Invalid note metadata in ${expectedId}.md.`);
  }
  const input = validateInput({ title: metadata.title, tags: metadata.tags, body: source.slice(match[0].length) });
  return { ...input, id: expectedId, createdAt: metadata.createdAt, updatedAt: metadata.updatedAt };
}
