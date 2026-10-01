// Full structure of a saved note.
export type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

// Input only needs the fields the user can edit.
// id and timestamps are created by the application.
export type NoteInput = Pick<
  Note,
  "title" | "body" | "tags"
>;

// State returned by server actions.
export type ActionState = {
  error: string;
};

// Shared input-size limits.
export const MAX_BODY = 100_000;
export const MAX_TITLE = 200;

// Clean tags by trimming spaces, converting to lowercase,
// removing empty values, and removing duplicates.
export function normalizeTags(
  tags: string[]
): string[] {
  const cleaned = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(cleaned)];
}

// Validate and clean note data before it is saved or loaded.
export function validateInput(
  input: NoteInput
): NoteInput {
  // Remove extra spaces around the title.
  const title = input.title.trim();

  // Normalize all tags before validating them.
  const tags = normalizeTags(input.tags);

  // Require a non-empty title within the maximum length.
  if (
    !title ||
    title.length > MAX_TITLE
  ) {
    throw new Error(
      `Title must contain 1–${MAX_TITLE} characters.`
    );
  }

  // Prevent extremely large note bodies.
  if (input.body.length > MAX_BODY) {
    throw new Error(
      `Body must be at most ${MAX_BODY.toLocaleString()} characters.`
    );
  }

  // Allow at most 20 tags.
  // Each tag must be 1–40 characters and contain only
  // letters, numbers, underscores, or hyphens.
  if (
    tags.length > 20 ||
    tags.some(
      (tag) =>
        tag.length > 40 ||
        !/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(tag)
    )
  ) {
    throw new Error(
      "Use up to 20 tags, each 1–40 letters, numbers, hyphens, or underscores."
    );
  }

  // Return the cleaned version of the input.
  return {
    title,
    body: input.body,
    tags,
  };
}

// Return only notes that match all search terms
// and all selected tags.
export function filterNotes(
  notes: Note[],
  query: string,
  tags: string[]
): Note[] {
  // Break the search text into lowercase search terms.
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  // Clean the selected tag filters.
  const selected = normalizeTags(tags);

  return notes.filter((note) => {
    // Search both the note title and body.
    const text =
      `${note.title}\n${note.body}`.toLowerCase();

    const matchesSearch = terms.every(
      (term) => text.includes(term)
    );

    const matchesTags = selected.every(
      (tag) => note.tags.includes(tag)
    );

    return matchesSearch && matchesTags;
  });
}

// Count how many notes use each tag.
export function tagCounts(
  notes: Note[]
): [string, number][] {
  const counts = new Map<string, number>();

  for (const note of notes) {
    // Set prevents a duplicate tag inside one note
    // from being counted more than once.
    for (const tag of new Set(note.tags)) {
      const currentCount =
        counts.get(tag) ?? 0;

      counts.set(
        tag,
        currentCount + 1
      );
    }
  }

  // Convert the Map into an array and sort tags alphabetically.
  return [...counts].sort(
    ([a], [b]) =>
      a.localeCompare(b)
  );
}
