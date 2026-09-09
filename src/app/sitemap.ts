import type { MetadataRoute } from 'next';

const baseUrl = 'https://www.knowmato.in';
const apiBaseUrl = 'https://api.knowmato.in/api/v2';

interface PublicCourse {
  slug: string;
  updated_at?: string;
}

interface PublicCoursesResponse {
  success: boolean;
  data?: PublicCourse[];
}

async function getPublicCourses(): Promise<PublicCourse[]> {
  try {
    const response = await fetch(`${apiBaseUrl}/public/courses/`, {
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      console.error(
        `Sitemap: Failed to fetch public courses. Status: ${response.status}`,
      );

      return [];
    }

    const result: PublicCoursesResponse = await response.json();

    if (!result.success || !Array.isArray(result.data)) {
      console.error('Sitemap: Invalid public courses response.');

      return [];
    }

    return result.data;
  } catch (error) {
    console.error('Sitemap: Error fetching public courses:', error);

    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getPublicCourses();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/become-a-tutor`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/become-a-partner`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  const coursePages: MetadataRoute.Sitemap = courses
    .filter((course) => course.slug)
    .map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: course.updated_at
        ? new Date(course.updated_at)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  return [...staticPages, ...coursePages];
}