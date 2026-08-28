import { SITE_URL } from 'lib/seo/graph'
import type { MetadataRoute } from 'next'

/**
 * Generate the /sitemap.xml response.
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
        {
            url: `${SITE_URL}/miscellaneous`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
    ]
}
