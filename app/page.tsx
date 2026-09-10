import { Suspense } from "react";
import Link from "next/link";
import { notes } from "@/lib/notes";
import { filterNotes, tagCounts } from "@/lib/model";
import { readFilters, type SearchParams } from "@/lib/search";
import { SearchControls } from "@/components/search-controls";
import { NoteList } from "@/components/note-list";

export const dynamic = "force-dynamic";
export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const all = await notes.list();
  const { q, tags } = readFilters(await searchParams);
  return <><div className="heading"><h1>All notes</h1><Link className="button" href="/notes/new">New note</Link></div>
    <Suspense fallback={<p>Loading search…</p>}><SearchControls tags={tagCounts(all)} /></Suspense>
    <NoteList notes={filterNotes(all, q, tags)} />
  </>;
}
