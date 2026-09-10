import Link from "next/link";
import { notes } from "@/lib/notes";
import { tagCounts } from "@/lib/model";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tags" };
export default async function Tags() {
  const tags = tagCounts(await notes.list());
  return <><h1>Tags</h1>{tags.length ? <ul className="note-list">{tags.map(([tag, count]) => <li key={tag}>
    <Link href={`/tags/${encodeURIComponent(tag)}`}>#{tag}</Link> <span className="muted">{count} {count === 1 ? "note" : "notes"}</span>
  </li>)}</ul> : <p>No tags yet. Add tags while editing a note.</p>}</>;
}
