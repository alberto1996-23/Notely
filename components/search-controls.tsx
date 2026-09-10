"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SearchControls({ tags, fixedTag }: { tags: [string, number][]; fixedTag?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canonical = searchParams.toString();
  const query = searchParams.get("q") ?? "";
  const [input, setInput] = useState(query);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = searchParams.getAll("tag");
  const ownNavigations = useRef(new Set<string>());
  function cancelDebounce() { if (timer.current) clearTimeout(timer.current); }
  // Back/forward and links restore both the results and the visible input.
  useEffect(() => {
    // A completed search must not erase text typed while its request was in flight.
    if (ownNavigations.current.delete(canonical)) return;
    setInput(query); cancelDebounce();
  }, [query, canonical]);
  useEffect(() => () => cancelDebounce(), []);
  function navigate(params: URLSearchParams) {
    const suffix = params.toString();
    if (suffix === canonical) return;
    ownNavigations.current.add(suffix);
    startTransition(() => router.replace(`${pathname}${suffix ? `?${suffix}` : ""}`, { scroll: false }));
  }
  function withQuery(value: string) {
    const params = new URLSearchParams(canonical);
    if (value.trim()) params.set("q", value); else params.delete("q");
    return params;
  }
  return <section className="search" aria-label="Filter notes" aria-busy={pending}>
    <form onSubmit={(event) => { event.preventDefault(); cancelDebounce(); navigate(withQuery(input)); }}>
      <label htmlFor="search">Search titles and bodies</label>
      <input id="search" name="q" type="search" value={input} onChange={(event) => {
        const value = event.target.value;
        setInput(value); cancelDebounce();
        timer.current = setTimeout(() => navigate(withQuery(value)), 300);
      }} />
    </form>
    {!!tags.length && <fieldset><legend>Match all selected tags</legend><div className="tag-options">
      {tags.map(([tag, count]) => <label key={tag}>
        <input type="checkbox" checked={tag === fixedTag || selected.includes(tag)} disabled={pending || tag === fixedTag} onChange={(event) => {
          cancelDebounce();
          const params = withQuery(input);
          const next = selected.filter((value) => value !== tag);
          if (event.target.checked) next.push(tag);
          params.delete("tag");
          next.forEach((value) => params.append("tag", value));
          navigate(params);
        }} /> {tag} ({count})
      </label>)}
    </div></fieldset>}
    <p role="status" className="muted">{pending ? "Updating results…" : "Search and tag filters are included in this page’s URL."}</p>
  </section>;
}
