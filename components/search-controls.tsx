"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

export function SearchControls({
  tags,
  fixedTag,
}: {
  tags: [string, number][];
  fixedTag?: string;
}) {
  // Next.js helpers for reading and changing the current URL.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Current query string, such as "q=react&tag=school".
  const canonical = searchParams.toString();

  // Get the current text search from the URL.
  const query = searchParams.get("q") ?? "";

  // Store the text currently visible in the search input.
  const [input, setInput] = useState(query);

  // Track whether a URL/results update is currently happening.
  const [pending, startTransition] = useTransition();

  // Store the debounce timer without causing re-renders.
  const timer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read all selected tags from the URL.
  const selected = searchParams.getAll("tag");

  // Remember URLs created by this component itself.
  const ownNavigations = useRef(new Set<string>());

  // Cancel a scheduled debounced search.
  function cancelDebounce() {
    if (timer.current) {
      clearTimeout(timer.current);
    }
  }

  // Keep the visible input synchronized with Back/Forward
  // navigation or links that change the URL.
  useEffect(() => {
    // Ignore URL changes caused by our own navigation so
    // newer text typed by the user is not overwritten.
    if (ownNavigations.current.delete(canonical)) {
      return;
    }

    setInput(query);
    cancelDebounce();
  }, [query, canonical]);

  // Cancel any remaining timer when this component is removed.
  useEffect(() => {
    return () => cancelDebounce();
  }, []);

  // Update the current URL without adding a new browser
  // history entry for every search/filter change.
  function navigate(params: URLSearchParams) {
    const suffix = params.toString();

    // Do nothing if the URL would stay exactly the same.
    if (suffix === canonical) {
      return;
    }

    ownNavigations.current.add(suffix);

    startTransition(() => {
      router.replace(
        `${pathname}${suffix ? `?${suffix}` : ""}`,
        { scroll: false }
      );
    });
  }

  // Return a copy of the current search parameters
  // with the text query added, changed, or removed.
  function withQuery(value: string) {
    const params = new URLSearchParams(canonical);

    if (value.trim()) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    return params;
  }

  return (
    <section
      className="search"
      aria-label="Filter notes"
      aria-busy={pending}
    >
      <form
        onSubmit={(event) => {
          // Prevent a normal browser form submission.
          event.preventDefault();

          // Pressing Enter should search immediately.
          cancelDebounce();
          navigate(withQuery(input));
        }}
      >
        <label htmlFor="search">
          Search titles and bodies
        </label>

        <input
          id="search"
          name="q"
          type="search"
          value={input}
          onChange={(event) => {
            const value = event.target.value;

            // Immediately update what the user sees.
            setInput(value);

            // Restart the debounce timer after every keystroke.
            cancelDebounce();

            // Wait 300ms after typing stops before updating the URL.
            timer.current = setTimeout(() => {
              navigate(withQuery(value));
            }, 300);
          }}
        />
      </form>

      {/* Only show tag filters when tags exist. */}
      {tags.length > 0 && (
        <fieldset>
          <legend>
            Match all selected tags
          </legend>

          <div className="tag-options">
            {tags.map(([tag, count]) => (
              <label key={tag}>
                <input
                  type="checkbox"

                  // Fixed tags and URL-selected tags appear checked.
                  checked={
                    tag === fixedTag ||
                    selected.includes(tag)
                  }

                  // Don't change filters during navigation.
                  // A fixed route tag also cannot be unchecked.
                  disabled={
                    pending ||
                    tag === fixedTag
                  }

                  onChange={(event) => {
                    cancelDebounce();

                    // Preserve the current text search.
                    const params = withQuery(input);

                    // Start with all selected tags except this one.
                    const next = selected.filter(
                      (value) => value !== tag
                    );

                    // Add the tag back if the checkbox was checked.
                    if (event.target.checked) {
                      next.push(tag);
                    }

                    // Rebuild all tag parameters in the URL.
                    params.delete("tag");

                    next.forEach((value) => {
                      params.append("tag", value);
                    });

                    navigate(params);
                  }}
                />

                {" "}
                {tag} ({count})
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Report whether results are currently being updated. */}
      <p
        role="status"
        className="muted"
      >
        {pending
          ? "Updating results…"
          : "Search and tag filters are included in this page’s URL."}
      </p>
    </section>
  );
}