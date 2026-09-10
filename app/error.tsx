"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <><h1>Unable to load notes</h1><p>Check the server log and the format and permissions of files in the notes directory.</p><button onClick={reset}>Try again</button></>;
}
