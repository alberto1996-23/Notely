// Raw URL search parameters may contain one value,
// multiple values, or no value at all.
export type SearchParams =
  Record<
    string,
    string | string[] | undefined
  >;

// Convert raw URL parameters into the simple filter
// values used by the rest of the application.
export function readFilters(
  params: SearchParams
) {
  // Search text should always be one string.
  // If q appears multiple times, use the first value.
  const q = Array.isArray(params.q)
    ? params.q[0]
    : params.q ?? "";

  // Tags should always be an array.
  // One tag becomes [tag], and no tag becomes [].
  const tags = Array.isArray(params.tag)
    ? params.tag
    : params.tag
      ? [params.tag]
      : [];

  return {
    q,
    tags,
  };
}
