"use client";

export default function ErrorPage({
  reset
}: {
  reset: () => void;
}) {
  return (
    <>
      {/* Shown when an unexpected error prevents the notes UI from loading. */}
      <h1>Unable to load notes</h1>
      
      {/* Gives the user a likely place to investigate server-side failures. */}
      <p>
        Check the server log and the format and permissions of files in the notes directory.
      </p>
      
      {/* Ask Next.js to retry rendering the route that failed. */}
      <button onClick={reset}>
        Try again
      </button>
    </>
  );
}
