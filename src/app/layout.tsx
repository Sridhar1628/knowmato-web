import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.knowmato.in'),

  title: {
    default: 'KnowMato — Online Doubt Solving & Learning Platform',
    template: '%s | KnowMato',
  },

  description:
    'KnowMato is a student-focused learning platform for solving academic doubts with tutors and accessing courses, current affairs, coding, assignments, jobs, internships, educational content, and AI-powered assistance.',

  applicationName: 'KnowMato',

  authors: [
    {
      name: 'KnowMato',
    },
  ],

  creator: 'KnowMato',

  publisher: 'KnowMato',

  keywords: [
    'online doubt solving',
    'ask doubts',
    'solve academic doubts',
    'online tutors',
    'student learning platform',
    'doubt solving platform',
    'academic help',
    'online education',
    'student resources',
    'KnowMato',
  ],

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.knowmato.in/',
    siteName: 'KnowMato',
    title: 'KnowMato — Online Doubt Solving & Learning Platform',
    description:
      'Solve academic doubts with tutors and explore a growing learning ecosystem for courses, current affairs, coding, assignments, jobs, internships, educational content, and AI-powered assistance.',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'KnowMato — Online Doubt Solving & Learning Platform',
    description:
      'Solve academic doubts with tutors and access a growing student learning ecosystem with KnowMato.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}