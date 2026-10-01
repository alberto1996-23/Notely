"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { saveNote } from "@/app/actions";
import { renderMarkdown } from "@/lib/markdown";
import { MAX_BODY, MAX_TITLE, type Note } from "@/lib/model";

export function NoteEditor({
  note 
}: { 
  note?: Note 
}) {
  // Start with saved values when editing,
  // or empty values when creating a note.
  const [title, setTitle] = useState(
    note?.title ?? ""
  );

  const [body, setBody] = useState(
    note?.body ?? ""
  );

  // Convert the saved tag array into editable comma-separated text.
  const [tags, setTags] = useState(
    note?.tags.join(", ") ?? ""
  );

  // Connect the form to the saveNote server action.
  // An existing id/version means "update"; null means "create".
  const [state, action, pending] = useActionState(
    saveNote.bind(
      null, 
      note?.id ?? null,
      note?.updatedAt ?? null
    ), 
    { error: "" }
  );

  // Re-render the Markdown preview whenever the body changes.
  const html = useMemo(
    () => renderMarkdown(body), 
    [body]
  );

  return (
    <form action={action}>
      {/* Disable all editor controls while the note is saving. */}
      <fieldset disabled={pending}>
        <label htmlFor="title">
          Title
        </label>

        {/* Controlled title input. */}
        <input
          id="title"
          name="title"
          required
          maxLength={MAX_TITLE}
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
        />

        <label htmlFor="tags">
          Tags
        </label>

        {/* Tags are entered as comma-separated text. */}
        <input
          id="tags"
          name="tags"
          value={tags}
          onChange={(event) =>
            setTags(event.target.value)
          }
          aria-describedby="tag-help"
        />

        <p
          id="tag-help"
          className="muted"
        >
          Separate tags with commas. Remove a tag by deleting
          it here. Use letters, numbers, hyphens, or underscores.
        </p>

        <div className="editor-grid">
          <div>
            <label htmlFor="body">
              Markdown
            </label>

            {/* Controlled Markdown editor. */}
            <textarea
              id="body"
              name="body"
              maxLength={MAX_BODY}
              value={body}
              onChange={(event) =>
                setBody(event.target.value)
              }
              spellCheck
            />
          </div>

          {/* Live preview of the current Markdown body. */}
          <section aria-label="Live markdown preview">
            <h2>Preview</h2>

            {body ? (
              <div
                className="markdown preview"
                dangerouslySetInnerHTML={{
                  __html: html,
                }}
              />
            ) : (
              <p className="muted">
                Your preview appears as you type.
              </p>
            )}
          </section>
        </div>

        {/* This editor uses explicit saving instead of autosave. */}
        <p className="muted">
          Changes are saved when you choose Save note.
        </p>

        <div className="actions">
          {/* Change the button label while saving. */}
          <button type="submit">
            {pending ? "Saving…" : "Save note"}
          </button>

          {/* Editing returns to the note; creating returns home. */}
          <Link
            href={
              note
                ? `/notes/${note.id}`
                : "/"
            }
          >
            Cancel
          </Link>
        </div>
      </fieldset>

      {/* Show errors returned by the saveNote server action. */}
      {state.error && (
        <p
          role="alert"
          className="error"
        >
          {state.error}
        </p>
      )}
    </form>
  );  
}
