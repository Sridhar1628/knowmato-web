import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Contact KnowMato for student support, courses, tutoring, payments, partnerships, and general enquiries. KnowMato is operated by JEBLIO CORPORATION PRIVATE LIMITED.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Us | KnowMato',
    description:
      'Get in touch with KnowMato for support, learning, tutoring, partnerships, and general enquiries.',
    url: 'https://www.knowmato.in/contact',
    siteName: 'KnowMato',
    type: 'website',
  },
};

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      <path
        d="M4 6.5h16v11H4v-11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m4.5 7 7.5 6 7.5-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      <path
        d="M6.5 4.5h3l1.5 4-2 1.5c.9 2 2.5 3.6 4.5 4.5l1.5-2 4 1.5v3c0 .8-.7 1.5-1.5 1.5C11.1 18.5 5.5 12.9 5.5 6c0-.8.7-1.5 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      <path
        d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M4 10h11M11 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M11 4h5v5M16 4l-7 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 11v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0f0c29] text-white">
      {/* =========================================================
          BACKGROUND
      ========================================================== */}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#211d4d] to-[#17172f]" />

        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl sm:h-96 sm:w-96" />

        <div className="absolute -right-32 top-32 h-72 w-72 rounded-full bg-fuchsia-600/15 blur-3xl sm:h-96 sm:w-96" />

        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl sm:h-96 sm:w-96" />

        <div className="absolute left-[8%] top-[24%] h-3 w-3 animate-pulse rounded-full bg-violet-300/50" />

        <div className="absolute right-[12%] top-[18%] h-4 w-4 animate-pulse rounded-full bg-fuchsia-300/40" />

        <div className="absolute bottom-[18%] right-[20%] h-3 w-3 animate-pulse rounded-full bg-cyan-300/40" />
      </div>

      {/* =========================================================
          HEADER
      ========================================================== */}

      <header className="relative z-20 border-b border-white/10 bg-[#0f0c29]/70 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="KnowMato home"
          >
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
              KnowMato
            </span>

            <span
              className="hidden text-lg sm:inline"
              aria-hidden="true"
            >
              🎓
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex items-center gap-1 sm:gap-2"
          >
            <Link
              href="/courses"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-base"
            >
              Courses
            </Link>

            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-base"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02] hover:shadow-violet-500/30 sm:px-5 sm:text-base"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* =========================================================
          HERO
      ========================================================== */}

      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-white/5 px-4 py-2 text-sm font-semibold text-violet-200 backdrop-blur-md">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              We&apos;re here to help
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
              Get in{' '}
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
              Have a question about KnowMato, our learning platform,
              courses, tutors, support, or partnerships? Reach out to us.
              We&apos;re always happy to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          CONTACT INFORMATION
      ========================================================== */}

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {/* Email */}
          <a
            href="mailto:knowmatoinfo@gmail.com"
            className="group rounded-3xl border border-violet-300/20 bg-white/[0.04] p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-violet-300/40 hover:bg-white/[0.07]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 transition group-hover:scale-105">
              <MailIcon />
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.15em] text-violet-300">
              KnowMato Support
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              Email Support
            </h2>

            <p className="mt-3 break-all text-sm leading-6 text-white/60">
              knowmatoinfo@gmail.com
            </p>

            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">
              Send an email
              <ArrowIcon />
            </span>
          </a>

          {/* Phone */}
          <a
            href="tel:+919952877911"
            className="group rounded-3xl border border-fuchsia-300/20 bg-white/[0.04] p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-fuchsia-300/40 hover:bg-white/[0.07]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-300 transition group-hover:scale-105">
              <PhoneIcon />
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.15em] text-fuchsia-300">
              Phone
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              General Enquiries
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/60">
              +91 99528 77911
            </p>

            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">
              Call us
              <ArrowIcon />
            </span>
          </a>

          {/* Address */}
          <div className="group rounded-3xl border border-cyan-300/20 bg-white/[0.04] p-7 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.07]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 transition group-hover:scale-105">
              <LocationIcon />
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.15em] text-cyan-300">
              Our Office
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              JEBLIO CORPORATION PRIVATE LIMITED
            </h2>

            <address className="mt-3 not-italic text-sm leading-6 text-white/60">
              3B, Kavin Gardens Extension,
              <br />
              Modachur, Gobichettipalayam South,
              <br />
              Erode District, Tamil Nadu,
              <br />
              India – 638476
            </address>
          </div>
        </div>
      </section>

      {/* =========================================================
          COMPANY INFORMATION
      ========================================================== */}

      <section className="relative z-10 border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300">
                Official company information
              </p>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
                KnowMato is operated by{' '}
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  JEBLIO CORPORATION PRIVATE LIMITED
                </span>
              </h2>

              <p className="mt-6 max-w-3xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
                KnowMato is a student-focused learning platform built to help
                students solve academic doubts, learn new skills, discover
                courses, explore opportunities, and access educational tools
                in one connected ecosystem.
              </p>
            </div>

            <div className="rounded-[2rem] border border-violet-300/20 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-cyan-500/10 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
                Business &amp; General Enquiries
              </p>

              <a
                href="mailto:jeblioinfo@gmail.com"
                className="mt-3 block break-all text-lg font-bold text-white transition hover:text-cyan-300 sm:text-xl"
              >
                jeblioinfo@gmail.com
              </a>

              <div className="my-6 h-px bg-white/10" />

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-300">
                KnowMato Support
              </p>

              <a
                href="mailto:knowmatoinfo@gmail.com"
                className="mt-3 block break-all text-lg font-bold text-white transition hover:text-violet-300 sm:text-xl"
              >
                knowmatoinfo@gmail.com
              </a>

              <div className="my-6 h-px bg-white/10" />

              <p className="text-sm font-bold uppercase tracking-[0.18em] text-fuchsia-300">
                Phone
              </p>

              <a
                href="tel:+919952877911"
                className="mt-3 block text-lg font-bold text-white transition hover:text-fuchsia-300 sm:text-xl"
              >
                +91 99528 77911
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          HOW WE CAN HELP
      ========================================================== */}

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            How can we help?
          </p>

          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl md:text-5xl">
            Let&apos;s find the right way forward
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
            Choose the type of help you need and reach out through the most
            suitable channel.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="mailto:knowmatoinfo@gmail.com?subject=Student%20Support%20Enquiry"
            className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-300/30 hover:bg-white/[0.07]"
          >
            <span className="text-3xl" aria-hidden="true">
              🎓
            </span>

            <h3 className="mt-5 text-lg font-bold text-white">
              Student Support
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/55">
              Get help with your KnowMato account, learning experience, or
              general student questions.
            </p>

            <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-violet-300">
              Contact support
              <ArrowIcon />
            </span>
          </a>

          <a
            href="mailto:knowmatoinfo@gmail.com?subject=Course%20Enquiry"
            className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.07]"
          >
            <span className="text-3xl" aria-hidden="true">
              📚
            </span>

            <h3 className="mt-5 text-lg font-bold text-white">
              Courses &amp; Learning
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/55">
              Ask about courses, learning resources, assessments, and
              educational opportunities.
            </p>

            <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-cyan-300">
              Ask a question
              <ArrowIcon />
            </span>
          </a>

          <a
            href="mailto:knowmatoinfo@gmail.com?subject=Tutor%20Enquiry"
            className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-fuchsia-300/30 hover:bg-white/[0.07]"
          >
            <span className="text-3xl" aria-hidden="true">
              👨‍🏫
            </span>

            <h3 className="mt-5 text-lg font-bold text-white">
              Tutor Support
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/55">
              Get assistance related to tutoring, doubt solving, and the
              KnowMato tutor community.
            </p>

            <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-fuchsia-300">
              Contact us
              <ArrowIcon />
            </span>
          </a>

          <a
            href="mailto:jeblioinfo@gmail.com?subject=Business%20Enquiry"
            className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-300/30 hover:bg-white/[0.07]"
          >
            <span className="text-3xl" aria-hidden="true">
              🤝
            </span>

            <h3 className="mt-5 text-lg font-bold text-white">
              Business &amp; Partnerships
            </h3>

            <p className="mt-3 text-sm leading-6 text-white/55">
              Explore partnerships, collaborations, institutional
              opportunities, and business enquiries.
            </p>

            <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-emerald-300">
              Talk to us
              <ArrowIcon />
            </span>
          </a>
        </div>
      </section>

      {/* =========================================================
          CONTACT CTA
      ========================================================== */}

      <section className="relative z-10 px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-violet-300/20 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/10 p-8 text-center shadow-2xl sm:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-200">
            Need assistance?
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            We&apos;d love to hear from you.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
            For KnowMato support, email our support team. For business,
            partnership, and general enquiries, contact JEBLIO CORPORATION
            PRIVATE LIMITED.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="mailto:knowmatoinfo@gmail.com"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-4 font-bold text-white shadow-xl shadow-violet-500/20 transition hover:-translate-y-0.5 hover:shadow-2xl"
            >
              Email KnowMato Support
              <ArrowIcon />
            </a>

            <a
              href="mailto:jeblioinfo@gmail.com"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-white/5 px-7 py-4 font-bold text-white transition hover:border-cyan-300/30 hover:bg-white/10"
            >
              Business Enquiries
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================
          LEGAL / FOOTER
      ========================================================== */}

      <footer className="relative z-10 border-t border-white/10 bg-[#0b0920]/80">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
            {/* Brand */}
            <div className="max-w-md">
              <Link
                href="/"
                className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-black text-transparent"
              >
                KnowMato
              </Link>

              <p className="mt-4 text-sm leading-6 text-white/50">
                Solve doubts, learn new skills, explore opportunities, and
                grow with KnowMato.
              </p>

              <p className="mt-6 text-sm font-semibold text-white/80">
                Operated by
              </p>

              <p className="mt-1 text-sm font-bold text-white">
                JEBLIO CORPORATION PRIVATE LIMITED
              </p>

              <p className="mt-4 text-sm text-white/50">
                +91 99528 77911
              </p>

              <a
                href="mailto:jeblioinfo@gmail.com"
                className="mt-1 block text-sm text-cyan-300 transition hover:text-cyan-200"
              >
                jeblioinfo@gmail.com
              </a>

              <a
                href="mailto:knowmatoinfo@gmail.com"
                className="mt-1 block text-sm text-violet-300 transition hover:text-violet-200"
              >
                knowmatoinfo@gmail.com
              </a>
            </div>

            {/* Explore */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white">
                Explore
              </h3>

              <div className="mt-5 space-y-3 text-sm">
                <Link
                  href="/"
                  className="block text-white/60 transition hover:text-white"
                >
                  Home
                </Link>

                <Link
                  href="/courses"
                  className="block text-white/60 transition hover:text-white"
                >
                  Courses
                </Link>

                <Link
                  href="/become-a-tutor"
                  className="block text-white/60 transition hover:text-white"
                >
                  Become a Tutor
                </Link>

                <Link
                  href="/become-a-partner"
                  className="block text-white/60 transition hover:text-white"
                >
                  Become a Partner
                </Link>

                <Link
                  href="/contact"
                  className="block font-semibold text-cyan-300 transition hover:text-cyan-200"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white">
                Legal &amp; Support
              </h3>

              <div className="mt-5 space-y-3 text-sm">
                <Link
                  href="/legal"
                  className="flex items-center gap-2 text-white/60 transition hover:text-white"
                >
                  Privacy Policy
                  <ExternalLinkIcon />
                </Link>

                <Link
                  href="/terms"
                  className="flex items-center gap-2 text-white/60 transition hover:text-white"
                >
                  Terms &amp; Conditions
                  <ExternalLinkIcon />
                </Link>

                <Link
                  href="/refund-policy"
                  className="flex items-center gap-2 text-white/60 transition hover:text-white"
                >
                  Refund &amp; Cancellation
                  <ExternalLinkIcon />
                </Link>

                <Link
                  href="/delete-account"
                  className="flex items-center gap-2 text-white/60 transition hover:text-white"
                >
                  Delete Account
                  <ExternalLinkIcon />
                </Link>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="mt-10 border-t border-white/10 pt-7">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">
              Office Address
            </p>

            <address className="mt-2 not-italic text-sm leading-6 text-white/50">
              3B, Kavin Gardens Extension, Modachur, Gobichettipalayam South,
              Erode District, Tamil Nadu, India – 638476
            </address>
          </div>

          {/* Copyright */}
          <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} KnowMato. All rights reserved.
            <span className="mx-2 text-white/20">•</span>
            JEBLIO CORPORATION PRIVATE LIMITED
          </div>
        </div>
      </footer>
    </main>
  );
}