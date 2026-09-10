# Teaching notes

## Dynamic Routes

`app/notes/[slug]/page.tsx` maps a URL segment to a note ID. In current Next.js, route `params` is a Promise: await it before reading `slug`. `notes.get()` validates the slug before touching disk. A missing note calls `notFound()`, which renders the nearest not-found component. The edit page follows the same lookup pattern. The per-tag route awaits `[tag]` and verifies it exists in the current tag index.

The read view demonstrates `generateStaticParams()`: Next.js lists existing note IDs during the build and pre-renders those pages. `dynamicParams = true` allows notes created after the build to resolve on demand. `revalidate = 60` permits stale pages to regenerate on a subsequent request after the interval; this is not a background timer or an immediate filesystem watcher. A Server Action calls `revalidatePath("/", "layout")`, invalidating the application tree so app-created changes become visible immediately. Direct disk changes can remain stale until the revalidation interval and a request, and an already open browser tab needs refresh.

The note list and tag views use `force-dynamic` because filesystem results and URL filters should be evaluated for each request. Editing is also dynamic to load the current version for conflict detection. The create page is a static shell with interactive controls. A fully static export was rejected: it cannot run Server Actions or maintain a writable notes directory. Caching the edit page was rejected because it would unnecessarily start users with stale drafts.

Reference: [Next.js generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params).

## Text Editing

The editor uses controlled `title`, `body`, and `tags` state, binding `value` and `onChange` to each input. Markdown is parsed and sanitized with the same helper on the client for live preview and on the server for the read page. Memoization prevents reparsing the body when only title or tags change. Raw HTML is untrusted: `marked` alone does not make it safe. An explicit `sanitize-html` allowlist removes scripts, event handlers, embedded media, styles, and dangerous URL schemes before `dangerouslySetInnerHTML` receives the result. Images are deliberately excluded, including remote tracking images. Markdown remains plain text on disk.

Explicit save makes the persistence boundary clear and reduces disk writes. Autosave was rejected for this reference app because it needs dirty-state tracking, write debouncing, conflict handling, and failure recovery. `useActionState` reports mutation errors without discarding the draft and disables fields while saving. Navigation away from an unsaved draft discards it; the form states the save behavior. Bound action arguments are still treated as untrusted: the storage layer validates IDs and inputs. Server Actions are network endpoints; a publicly deployed version would need authorization checks.

Writes use a temporary file in the same directory followed by an atomic rename, so reads never see partially written content. A process-local queue and `updatedAt` revision comparison prevent two app actions from silently overwriting each other. These checks do not provide cross-process locking or protect against concurrent external file editors; run one app instance and update metadata when editing files manually. The YAML parser deliberately supports only JSON-style scalar strings and arrays, both valid YAML, to avoid a third runtime dependency and hidden type coercions.

References: [Next.js Server Actions](https://nextjs.org/docs/app/api-reference/directives/use-server), [sanitize-html options](https://github.com/apostrophecms/sanitize-html), [Marked security guidance](https://marked.js.org/).

## Search

`filterNotes()` performs an in-memory scan of the files, matching every whitespace-separated query term against the lowercase title plus body. Selected tags also use AND semantics. This is sufficient for a small personal collection and searches raw Markdown (including link URLs and code). A database, fuzzy matcher, or indexing service would add complexity; larger collections would benefit from an index and pagination because this implementation reads the full collection on each list request.

The canonical state is `?q=...&tag=work&tag=learning`. The server uses it to filter results, and the client uses it to populate controls. Only the immediate typing draft lives in component state. A 300 ms debounce avoids a navigation per keystroke; Enter submits immediately. Selecting tags cancels the pending debounce and includes the current input. `router.replace` avoids filling browser history with one entry per query edit. Links and Back/Forward restore state from the URL. Shareability means opening the same URL against the same local notes collection; it does not upload notes or make localhost remotely accessible.

The `[tag]` route contributes a fixed filter while query parameters supply additional tags and text. That fixed tag is visible as a checked, disabled checkbox. Empty or whitespace-only queries impose no text restriction. Search renders results on the server instead of shipping every note body to the browser just to filter them.
