import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-32 text-center px-4">
      <p className="text-6xl font-bold text-accent">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist or was removed.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
