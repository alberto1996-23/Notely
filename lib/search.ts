export type SearchParams = Record<string, string | string[] | undefined>;
export function readFilters(params: SearchParams) {
  const q = Array.isArray(params.q) ? params.q[0] : params.q ?? "";
  const tags = Array.isArray(params.tag) ? params.tag : params.tag ? [params.tag] : [];
  return { q, tags };
}
