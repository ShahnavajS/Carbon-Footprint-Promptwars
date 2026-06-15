import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for could not be found.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <p className="text-8xl font-bold text-emerald-600 dark:text-emerald-400" aria-hidden="true">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Page not found
        </h1>
        <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 text-base font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
