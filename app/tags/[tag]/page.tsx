import { Suspense } from "react";
import { notFound } from "next/navigation";
import { notes } from "@/lib/notes";
import { filterNotes, tagCounts } from "@/lib/model";
import { readFilters, type SearchParams } from "@/lib/search";
import { NoteList } from "@/components/note-list";
import { SearchControls } from "@/components/search-controls";

// Always use the latest notes and URL filters instead of a cached page.
export const dynamic = "force-dynamic";

export default async function TagPage({
  params,
  searchParams 
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<SearchParams>
}) {
  // Get the tag from a URL like /tags/nextjs.
  const { tag } = await params;
  // Load every saved note.
  const all = await notes.list();
  // Build a list of tags and the number of notes using each tag.
  const counts = tagCounts(all);

  // Show the 404 page if the requested tag does not exist.
  if (!counts.some(([name]) => name === tag)) {
    notFound()
  };

  // Read the text search and any additional tag filters from the URL.
  const { q, tags } = readFilters(await searchParams);

  return (
    <>
      {/* Display the current tag as the page heading. */}
      <h1>#{tag}</h1>

      {/* Search/filter controls. The current route tag stays fixed. */}
      <Suspense fallback={<p>Loading search…</p>}>
        <SearchControls
          tags={counts}
          fixedTag={tag}
        />
      </Suspense>

      {/* Filter all notes by search text, the current tag,
          and any additional selected tags. */}
      <NoteList
        notes={filterNotes(all, q, [tag, ...tags])}
      />
    </>
  );
}
