import { Suspense } from "react";
import { notFound } from "next/navigation";
import { notes } from "@/lib/notes";
import { filterNotes, tagCounts } from "@/lib/model";
import { readFilters, type SearchParams } from "@/lib/search";
import { NoteList } from "@/components/note-list";
import { SearchControls } from "@/components/search-controls";

export const dynamic = "force-dynamic";
export default async function TagPage({ params, searchParams }: { params: Promise<{ tag: string }>; searchParams: Promise<SearchParams> }) {
  const tag = (await params).tag;
  const all = await notes.list();
  const counts = tagCounts(all);
  if (!counts.some(([name]) => name === tag)) notFound();
  const { q, tags } = readFilters(await searchParams);
  return <><h1>#{tag}</h1>
    <Suspense fallback={<p>Loading search…</p>}><SearchControls tags={counts} fixedTag={tag} /></Suspense>
    <NoteList notes={filterNotes(all, q, [tag, ...tags])} />
  </>;
}
