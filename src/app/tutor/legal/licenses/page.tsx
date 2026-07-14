// app/student/open-source-licenses/page.tsx
"use client";

import { useRouter } from "next/navigation";

const libraries = [
  {
    name: "React Native",
    license: "MIT License",
    url: "https://github.com/facebook/react-native/blob/main/LICENSE",
    description: "Framework for building native apps using React.",
  },
  {
    name: "Django",
    license: "BSD 3-Clause License",
    url: "https://github.com/django/django/blob/main/LICENSE",
    description: "High-level Python web framework for rapid development.",
  },
  {
    name: "Agora",
    license: "Proprietary (SDK usage under Agora Terms)",
    url: "https://www.agora.io/en/terms/",
    description: "Real-time voice and video calling infrastructure.",
  },
  {
    name: "Axios",
    license: "MIT License",
    url: "https://github.com/axios/axios/blob/main/LICENSE",
    description: "Promise-based HTTP client for browser and Node.js.",
  },
  {
    name: "Redux",
    license: "MIT License",
    url: "https://github.com/reduxjs/redux/blob/master/LICENSE.md",
    description: "Predictable state container for JavaScript apps.",
  },
  {
    name: "React Navigation",
    license: "MIT License",
    url: "https://github.com/react-navigation/react-navigation/blob/main/LICENSE",
    description: "Routing and navigation for React Native apps.",
  },
  {
    name: "Next.js",
    license: "MIT License",
    url: "https://github.com/vercel/next.js/blob/canary/license.md",
    description: "React framework for production web applications.",
  },
  {
    name: "Tailwind CSS",
    license: "MIT License",
    url: "https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE",
    description: "Utility-first CSS framework for rapid UI development.",
  },
  {
    name: "Framer Motion",
    license: "MIT License",
    url: "https://github.com/motiondivision/motion/blob/main/LICENSE",
    description: "Animation library for React.",
  },
  {
    name: "Redux Toolkit",
    license: "MIT License",
    url: "https://github.com/reduxjs/redux-toolkit/blob/master/LICENSE",
    description: "Official toolset for efficient Redux development.",
  },
  {
    name: "React Hot Toast",
    license: "MIT License",
    url: "https://github.com/timolins/react-hot-toast/blob/main/LICENSE",
    description: "Lightweight toast notifications for React.",
  },
  {
    name: "i18next",
    license: "MIT License",
    url: "https://github.com/i18next/i18next/blob/master/LICENSE",
    description: "Internationalization framework for JavaScript.",
  },
];

export default function OpenSourceLicensesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-8">
          📄 Open Source Licenses
        </h1>

        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-2xl">
          <p className="text-white/80 text-sm mb-6 leading-relaxed">
            KnowMato is built with the help of many open source projects. We are grateful to the developers and communities behind these technologies. Below is a list of major dependencies along with their respective licenses.
          </p>

          <div className="space-y-4">
            {libraries.map((lib, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0 gap-2"
              >
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{lib.name}</h3>
                  <p className="text-white/60 text-sm">{lib.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <a
                    href={lib.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 text-sm font-medium underline"
                  >
                    {lib.license}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/30">
          © {new Date().getFullYear()} Jeblio Corporation Private Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
}