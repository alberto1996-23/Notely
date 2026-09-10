export type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type NoteInput = Pick<Note, "title" | "body" | "tags">;
export type ActionState = { error: string };
export const MAX_BODY = 100_000;
export const MAX_TITLE = 200;

export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

export function validateInput(input: NoteInput): NoteInput {
  const title = input.title.trim();
  const tags = normalizeTags(input.tags);
  if (!title || title.length > MAX_TITLE) throw new Error(`Title must contain 1–${MAX_TITLE} characters.`);
  if (input.body.length > MAX_BODY) throw new Error(`Body must be at most ${MAX_BODY.toLocaleString()} characters.`);
  // Restrict tags to URL-safe, human-readable segments (including Unicode letters).
  if (tags.length > 20 || tags.some((tag) => tag.length > 40 || !/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(tag))) {
    throw new Error("Use up to 20 tags, each 1–40 letters, numbers, hyphens, or underscores.");
  }
  return { title, body: input.body, tags };
}

export function filterNotes(notes: Note[], query: string, tags: string[]): Note[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const selected = normalizeTags(tags);
  return notes.filter((note) => {
    const text = `${note.title}\n${note.body}`.toLowerCase();
    return terms.every((term) => text.includes(term)) && selected.every((tag) => note.tags.includes(tag));
  });
}

export function tagCounts(notes: Note[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const note of notes) for (const tag of new Set(note.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].sort(([a], [b]) => a.localeCompare(b));
}
