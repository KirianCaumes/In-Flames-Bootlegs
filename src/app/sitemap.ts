import type { MetadataRoute } from 'next'

const SITE_URL = 'https://in-flames-bootlegs.kiriancaumes.fr'

/**
 * Generate the /sitemap.xml response.
 * The archive is a single page, so the sitemap currently holds one homepage entry.
 * @returns Sitemap metadata consumed by Next.js to render /sitemap.xml.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: `${SITE_URL}/`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
    ]
}
