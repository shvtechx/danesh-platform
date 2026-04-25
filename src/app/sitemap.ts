import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://danesh.app';
  const locales = ['en', 'fa'];
  const lastModified = new Date();

  // Static pages
  const staticPages = [
    '',
    '/dashboard',
    '/courses',
    '/lessons',
    '/forum',
    '/quests',
    '/leaderboard',
    '/achievements',
    '/profile',
    '/settings',
    '/assessments',
    '/login',
    '/register',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for each locale
  locales.forEach((locale) => {
    staticPages.forEach((page) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified,
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : page === '/dashboard' ? 0.9 : 0.8,
      });
    });
  });

  // Add dynamic course pages (example IDs)
  const courseIds = ['1', '2', '3', '4', '5'];
  courseIds.forEach((id) => {
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/courses/${id}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  });

  return sitemapEntries;
}
