"use client";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Something went wrong
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        Couldn’t load this page
      </h1>
      <p className="mt-2 text-sm text-muted">
        Try again — your library is still here.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover"
      >
        Try again
      </button>
    </div>
  );
}
