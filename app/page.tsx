import { Suspense } from "react";
import Link from "next/link";
import { notes } from "@/lib/notes";
import { filterNotes, tagCounts } from "@/lib/model";
import { readFilters, type SearchParams } from "@/lib/search";
import { SearchControls } from "@/components/search-controls";
import { NoteList } from "@/components/note-list";

// Always render the home page using the latest notes and URL filters.
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams 
}: {
  searchParams: Promise<SearchParams>
}) {
  // Load every saved note.
  const allNotes = await notes.list();

  // Read the text search and selected tags from the URL.
  const { q, tags } = readFilters(await searchParams);

  return (
    <>
      <div className="heading">
        <h1>All notes</h1>
        
        {/* Link to the page for creating a new note. */}
        <Link 
          className="button" 
          href="/notes/new"
        >
          New note
        </Link>
      </div>

      {/* Display search and tag-filter controls.
        The fallback appears while the controls are loading. */}
      <Suspense fallback={<p>Loading search…</p>}>
        <SearchControls 
          tags={tagCounts(allNotes)} 
        />
      </Suspense>
      
      {/* Show only notes that match the current search and tags. */}
      <NoteList
        notes={filterNotes(allNotes, q, tags)}
      />
    </>
  );
}
