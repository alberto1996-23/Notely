"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { saveNote } from "@/app/actions";
import { renderMarkdown } from "@/lib/markdown";
import { MAX_BODY, MAX_TITLE, type Note } from "@/lib/model";

export function NoteEditor({ note }: { note?: Note }) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [tags, setTags] = useState(note?.tags.join(", ") ?? "");
  const [state, action, pending] = useActionState(saveNote.bind(null, note?.id ?? null, note?.updatedAt ?? null), { error: "" });
  const html = useMemo(() => renderMarkdown(body), [body]);
  return <form action={action}>
    <fieldset disabled={pending}>
      <label htmlFor="title">Title</label>
      <input id="title" name="title" required maxLength={MAX_TITLE} value={title} onChange={(event) => setTitle(event.target.value)} />
      <label htmlFor="tags">Tags</label>
      <input id="tags" name="tags" value={tags} onChange={(event) => setTags(event.target.value)} aria-describedby="tag-help" />
      <p id="tag-help" className="muted">Separate tags with commas. Remove a tag by deleting it here. Use letters, numbers, hyphens, or underscores.</p>
      <div className="editor-grid">
        <div><label htmlFor="body">Markdown</label>
          <textarea id="body" name="body" maxLength={MAX_BODY} value={body} onChange={(event) => setBody(event.target.value)} spellCheck />
        </div>
        <section aria-label="Live markdown preview"><h2>Preview</h2>
          {body ? <div className="markdown preview" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="muted">Your preview appears as you type.</p>}
        </section>
      </div>
      <p className="muted">Changes are saved when you choose Save note.</p>
      <div className="actions"><button type="submit">{pending ? "Saving…" : "Save note"}</button>
        <Link href={note ? `/notes/${note.id}` : "/"}>Cancel</Link>
      </div>
    </fieldset>
    {state.error && <p role="alert" className="error">{state.error}</p>}
  </form>;
}
