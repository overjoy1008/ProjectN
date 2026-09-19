import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const publicDirectory = resolve('public');
const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL;
const siteUrl = configuredUrl ? new URL(configuredUrl).origin : null;
const lastModified = new Date().toISOString();

const sitemapEntries = siteUrl
  ? [
      { path: '', changeFrequency: 'weekly', priority: '1.0' },
      { path: '/curriculum.html', changeFrequency: 'monthly', priority: '0.8' },
      { path: '/categories.html', changeFrequency: 'monthly', priority: '0.7' },
    ]
  : [];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(({ path, changeFrequency, priority }) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`;

await mkdir(publicDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(publicDirectory, 'robots.txt'), robots),
  writeFile(resolve(publicDirectory, 'sitemap.xml'), sitemap),
]);
