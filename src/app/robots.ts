import { SITE_URL } from 'lib/seo/graph'
import type { MetadataRoute } from 'next'

/** AI crawlers explicitly invited to index the archive for answer engines and model training. */
const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Bingbot']

/**
 * Generate the /robots.txt response.
 * Allows every crawler, names the major AI/search crawlers explicitly, and points to the sitemap.
 * @returns Robots metadata consumed by Next.js to render /robots.txt.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            { userAgent: '*', allow: '/' },
            { userAgent: AI_CRAWLERS, allow: '/' },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    }
}
