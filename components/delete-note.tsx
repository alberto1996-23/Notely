"use client";

import { useActionState } from "react";
import { deleteNote } from "@/app/actions";

export function DeleteNote({
  id,
  version
}: {
  id: string;
  version: string
}) {
  // Connect this form to the deleteNote server action.
  // bind() fills in the note id and current version ahead of time.
  const [state, action, pending] = useActionState(
    deleteNote.bind(null, id, version),
    { error: "" }
  );


  return (
    <form 
      action={action}
      onSubmit={(event) => {
        // Ask the user to confirm before permanently deleting.
        if (!window.confirm("Delete this note permanently?")) {
          event.preventDefault()
        };
      }}
    >
      {/* Disable the button while deletion is in progress. */}
      <button 
        className="danger" 
        disabled={pending}
      >
        {pending ? "Deleting…" : "Delete note"}
      </button>

      {/* Show any error returned by the server action. */}
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
