import Link from "next/link";

export default function CourseNotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-5 py-12 text-white">
      {/* ============================================================
          ANIMATED BACKGROUND BLOBS
      ============================================================ */}
      <div
        aria-hidden="true"
        className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl"
      />

      {/* ============================================================
          MAIN CONTENT
      ============================================================ */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Glass Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">
          {/* Inner glow */}
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 blur-2xl"
          />

          <div className="relative z-10">
            {/* ========================================================
                ICON
            ======================================================== */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 shadow-lg shadow-violet-500/10">
              <span
                aria-hidden="true"
                className="text-5xl"
              >
                📚
              </span>
            </div>

            {/* ========================================================
                BRAND LABEL
            ======================================================== */}
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
              KnowMato Courses
            </p>

            {/* ========================================================
                TITLE
            ======================================================== */}
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Course not found
            </h1>

            {/* ========================================================
                DESCRIPTION
            ======================================================== */}
            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/60 sm:text-base">
              The course you&apos;re looking for doesn&apos;t exist or is
              no longer available. Explore our available courses and find
              something that matches your learning goals.
            </p>

            {/* ========================================================
                PRIMARY CTA
            ======================================================== */}
            <Link
              href="/courses"
              className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:scale-[1.02] hover:from-violet-600 hover:to-fuchsia-600 hover:shadow-xl hover:shadow-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#211d48]"
            >
              <span>Browse Courses</span>

              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>

            {/* ========================================================
                SECONDARY CTA
            ======================================================== */}
            <Link
              href="/"
              className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/80 transition-all duration-200 hover:border-violet-400/40 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#211d48]"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l9-9 9 9M5 10v10h14V10"
                />
              </svg>

              Back to KnowMato
            </Link>

            {/* ========================================================
                BRAND FOOTER
            ======================================================== */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-xs text-white/35">
                Learn. Solve. Grow with KnowMato.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}