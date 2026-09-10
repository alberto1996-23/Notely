"use client";

import { useActionState } from "react";
import { deleteNote } from "@/app/actions";

export function DeleteNote({ id, version }: { id: string; version: string }) {
  const [state, action, pending] = useActionState(deleteNote.bind(null, id, version), { error: "" });
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm("Delete this note permanently?")) event.preventDefault();
  }}>
    <button className="danger" disabled={pending}>{pending ? "Deleting…" : "Delete note"}</button>
    {state.error && <p role="alert" className="error">{state.error}</p>}
  </form>;
}
