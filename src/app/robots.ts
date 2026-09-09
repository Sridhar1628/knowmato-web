import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/student/',
          '/tutor/',
          '/company/',
          '/chat/',
          '/videocall/',
          '/profile',
          '/credits',
          '/mobile-payment',
          '/payment-success',
          '/payment-failed',
          '/wallet-offers',
          '/otp',
          '/verify-register',
          '/forgot-password/',
        ],
      },
    ],
    sitemap: 'https://www.knowmato.in/sitemap.xml',
  };
}