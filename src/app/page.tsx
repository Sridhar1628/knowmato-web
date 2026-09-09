import Link from 'next/link';

const features = [
  {
    title: 'Doubt Solving',
    description:
      'Ask your academic questions and connect with tutors who can help you understand concepts clearly.',
    icon: '💡',
    featured: true,
  },
  {
    title: 'Courses',
    description:
      'Learn through structured courses and educational content designed to support your learning journey.',
    icon: '📚',
  },
  {
    title: 'Current Affairs',
    description:
      'Stay informed with current affairs and keep up with important events and knowledge.',
    icon: '📰',
  },
  {
    title: 'Coding Workspace',
    description:
      'Practice programming in a private workspace built for learning, experimenting, and improving your coding skills.',
    icon: '💻',
  },
  {
    title: 'Assignments',
    description:
      'Practice what you learn through assignments and assessments designed to strengthen your understanding.',
    icon: '📝',
  },
  {
    title: 'Jobs & Internships',
    description:
      'Discover career opportunities, job posts, and internship opportunities in one student-focused platform.',
    icon: '🚀',
  },
  {
    title: 'Educational Posts',
    description:
      'Explore useful educational posts, ideas, updates, and knowledge shared across the learning community.',
    icon: '✍️',
  },
  {
    title: 'AI Assistants',
    description:
      'Use AI-powered assistants to support your learning, exploration, and everyday educational needs.',
    icon: '🤖',
  },
];

const steps = [
  {
    number: '01',
    title: 'Ask Your Doubt',
    description:
      'Share the academic question or concept you need help understanding.',
  },
  {
    number: '02',
    title: 'Connect with a Tutor',
    description:
      'Get connected with a tutor who can help you work through your doubt.',
  },
  {
    number: '03',
    title: 'Understand & Learn',
    description:
      'Get the explanation you need and continue learning with the wider KnowMato ecosystem.',
  },
];

const faqs = [
  {
    question: 'What is KnowMato?',
    answer:
      'KnowMato is a student-focused educational platform centered around doubt solving, while also bringing learning, coding, career, community, and AI-powered tools together in one place.',
  },
  {
    question: 'What is the main feature of KnowMato?',
    answer:
      'The core of KnowMato is doubt solving. Students can use the platform to ask academic doubts and connect with tutors for help.',
  },
  {
    question: 'Can students use KnowMato for more than doubt solving?',
    answer:
      'Yes. KnowMato also includes courses, current affairs, coding workspace, assignments, jobs, internships, educational posts, and AI-powered assistants.',
  },
  {
    question: 'How can I become a KnowMato tutor?',
    answer:
      'You can learn more about becoming a tutor through the Become a Tutor page and submit your application there.',
  },
];

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

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5 shrink-0"
    >
      <path
        d="m5 10 3 3 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePage() {
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

        <div className="absolute left-[8%] top-[24%] h-3 w-3 rounded-full bg-violet-300/50 animate-pulse" />

        <div className="absolute right-[12%] top-[18%] h-4 w-4 rounded-full bg-fuchsia-300/40 animate-pulse" />

        <div className="absolute bottom-[18%] right-[20%] h-3 w-3 rounded-full bg-cyan-300/40 animate-pulse" />
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
            <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 sm:text-3xl">
              KnowMato
            </span>
            <span className="hidden text-lg sm:inline" aria-hidden="true">
              🎓
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="flex items-center gap-2 sm:gap-3"
          >
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
        <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          {/* Hero copy */}
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-white/5 px-4 py-2 text-sm font-semibold text-violet-200 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              A student-focused learning platform
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:mx-0 lg:text-7xl">
              Solve Your Doubts.
              <span className="mt-2 block text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                Learn. Grow. Move Forward.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8 lg:mx-0 lg:text-xl">
              KnowMato helps students solve academic doubts with tutors and
              access a growing learning ecosystem for courses, current affairs,
              coding, assignments, jobs, internships, educational content, and
              AI-powered assistance.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/login"
                className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-4 text-base font-bold text-white shadow-xl shadow-violet-500/20 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-violet-500/30 sm:text-lg"
              >
                Ask a Doubt
                <span className="transition-transform group-hover:translate-x-1">
                  <ArrowIcon />
                </span>
              </Link>

              <Link
                href="/register"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-base font-bold text-white backdrop-blur-md transition hover:bg-white/10 sm:text-lg"
              >
                Create Your Account
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-white/60 lg:justify-start">
              <span className="inline-flex items-center gap-2">
                <CheckIcon />
                Expert tutor support
              </span>

              <span className="inline-flex items-center gap-2">
                <CheckIcon />
                Student-focused tools
              </span>

              <span className="inline-flex items-center gap-2">
                <CheckIcon />
                Learning ecosystem
              </span>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-violet-500/20 via-fuchsia-500/15 to-cyan-500/20 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/50">
                    KnowMato
                  </p>
                  <p className="mt-1 text-lg font-bold text-white sm:text-xl">
                    Your learning journey
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xl shadow-lg">
                  🎓
                </div>
              </div>

              {/* Doubt card */}
              <div className="rounded-2xl border border-violet-300/20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-2xl">
                    💡
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                      Main focus
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                      Doubt Solving
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-white/60">
                      Ask questions, connect with tutors, understand concepts,
                      and keep learning.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                  <span className="h-2 w-2 rounded-full bg-white/20" />
                </div>
              </div>

              {/* Mini feature grid */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ['📚', 'Courses'],
                  ['💻', 'Coding'],
                  ['💼', 'Careers'],
                  ['🤖', 'AI Tools'],
                ].map(([icon, title]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.08]"
                  >
                    <span className="text-xl" aria-hidden="true">
                      {icon}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-white/80">
                      {title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          INTRO / TRUST
      ========================================================== */}
      <section className="relative z-10 border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300">
            One platform. Multiple ways to grow.
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            More than just doubt solving
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
            Doubt solving is at the heart of KnowMato. Around it, we are
            building a broader platform that supports students across
            learning, coding, career development, community, and AI-powered
            assistance.
          </p>
        </div>
      </section>

      {/* =========================================================
          FEATURES
      ========================================================== */}
      <section
        id="features"
        className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Explore KnowMato
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            Everything you need to keep learning
          </h2>

          <p className="mt-5 text-base leading-7 text-white/60 sm:text-lg">
            Start with your doubt and discover the tools that can help you
            learn, practice, build skills, and explore opportunities.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className={`group rounded-3xl border p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${
                feature.featured
                  ? 'border-violet-300/30 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 shadow-xl shadow-violet-500/10'
                  : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]'
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl transition group-hover:scale-105">
                {feature.icon}
              </div>

              <h3 className="mt-5 text-xl font-bold text-white">
                {feature.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/60">
                {feature.description}
              </p>

              {feature.featured && (
                <div className="mt-5 inline-flex rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-200">
                  KnowMato&apos;s core
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS
      ========================================================== */}
      <section className="relative z-10 border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-300">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl md:text-5xl">
              Get help with your doubts
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
              A simple path from question to understanding.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl"
              >
                <span className="text-sm font-black tracking-widest text-violet-300">
                  {step.number}
                </span>

                <h3 className="mt-4 text-xl font-bold text-white sm:text-2xl">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/60 sm:text-base">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          TUTOR / PARTNER CTA
      ========================================================== */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="overflow-hidden rounded-[2rem] border border-violet-300/20 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 p-7 sm:p-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-400/15 text-2xl">
              👨‍🏫
            </div>

            <h2 className="mt-6 text-2xl font-black text-white sm:text-3xl">
              Share your knowledge as a tutor
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
              Help students understand their doubts and become part of the
              KnowMato tutor community.
            </p>

            <Link
              href="/become-a-tutor"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
            >
              Become a Tutor
              <ArrowIcon />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-7 sm:p-9">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/15 text-2xl">
              🤝
            </div>

            <h2 className="mt-6 text-2xl font-black text-white sm:text-3xl">
              Partner with KnowMato
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
              Explore partnership opportunities and become part of the growing
              KnowMato ecosystem.
            </p>

            <Link
              href="/become-a-partner"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
            >
              Become a Partner
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          FUTURE VISION
      ========================================================== */}
      <section className="relative z-10 border-y border-white/10 bg-gradient-to-b from-white/[0.025] to-transparent">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-300">
            Growing with students
          </p>

          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl md:text-5xl">
            Building a bigger student ecosystem
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
            KnowMato is designed to grow beyond today&apos;s learning tools.
            Our vision includes helping students with career preparation,
            resumes, portfolios, resources, and other services that support
            their journey.
          </p>

          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
            {[
              'Learning',
              'Doubt Solving',
              'Coding',
              'Careers',
              'AI',
              'Resumes',
              'Portfolios',
              'Resources',
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ
      ========================================================== */}
      <section
        id="faq"
        className="relative z-10 mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-24"
      >
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Frequently asked questions
          </p>

          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Questions about KnowMato
          </h2>
        </div>

        <div className="mt-10 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl"
            >
              <summary className="cursor-pointer list-none pr-8 text-base font-bold text-white marker:hidden sm:text-lg">
                {faq.question}
              </summary>

              <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================== */}
      <section className="relative z-10 px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-violet-300/20 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/10 p-8 text-center shadow-2xl sm:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-200">
            Start with KnowMato
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            Have a question?
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">
              Let&apos;s solve it.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
            Create your KnowMato account and start your learning journey.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-4 font-bold text-white shadow-xl shadow-violet-500/20 transition hover:-translate-y-0.5"
            >
              Get Started
            </Link>

            <Link
              href="/login"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-7 py-4 font-bold text-white transition hover:bg-white/10"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="relative z-10 border-t border-white/10 bg-[#0b0920]/80">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <Link
                href="/"
                className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300"
              >
                KnowMato
              </Link>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Solve doubts, learn new skills, explore opportunities, and grow
                with KnowMato.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm sm:grid-cols-3 sm:gap-x-16">
              <Link
                href="/login"
                className="text-white/60 transition hover:text-white"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="text-white/60 transition hover:text-white"
              >
                Register
              </Link>

              <Link
                href="/become-a-tutor"
                className="text-white/60 transition hover:text-white"
              >
                Become a Tutor
              </Link>

              <Link
                href="/become-a-partner"
                className="text-white/60 transition hover:text-white"
              >
                Become a Partner
              </Link>

              <Link
                href="#features"
                className="text-white/60 transition hover:text-white"
              >
                Features
              </Link>

              <Link
                href="#faq"
                className="text-white/60 transition hover:text-white"
              >
                FAQ
              </Link>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} KnowMato. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}