import type { ArchiveShow } from 'lib/archive/shows'

/** Fetch implementation used by thumbnail adapters. */
type ThumbnailFetch = typeof fetch

/**
 * User agent used when fetching third-party media pages and images.
 * A real browser string is required: bot protections such as Akamai verify the
 * Googlebot identity by reverse DNS and reject spoofed crawler agents with a 403.
 */
const BROWSER_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

/** Google API playlist response subset used for thumbnail resolution. */
interface GoogleApiPlaylistResponse {
    /** Playlist items. */
    readonly items?: Array<{
        /** Playlist snippet. */
        readonly snippet?: {
            /** Playlist thumbnails. */
            readonly thumbnails?: {
                /** High resolution thumbnail. */
                readonly high?: {
                    /** Thumbnail URL. */
                    readonly url?: string
                }
            }
        }
    }>
}

/**
 * Build the local thumbnail path for an archive show.
 * @param show - Show to represent.
 * @param displayDate - Formatted date for readable URLs.
 * @returns Local thumbnail path.
 */
export function buildShowThumbnailPath(show: ArchiveShow, displayDate: string): string {
    return `/thumbnail/${show.id} - In Flames - ${show.city} ${show.country} - ${displayDate}`
}

/**
 * Resolve a media link to a thumbnail URL.
 * @param mediaLink - Link to resolve.
 * @param fetchAdapter - Fetch adapter for tests or runtime.
 * @returns Thumbnail image URL, or null when unavailable.
 */
export async function resolveMediaThumbnail(mediaLink: string, fetchAdapter: ThumbnailFetch = fetch): Promise<string | null> {
    try {
        const parsed = new URL(mediaLink)
        const youtubeVideoThumbnail = resolveYoutubeVideoThumbnail(parsed)
        if (youtubeVideoThumbnail) {
            return youtubeVideoThumbnail
        }

        const youtubePlaylistThumbnail = await resolveYoutubePlaylistThumbnail(parsed, fetchAdapter)
        if (youtubePlaylistThumbnail) {
            return youtubePlaylistThumbnail
        }

        return await resolveOpenGraphThumbnail(mediaLink, fetchAdapter)
    } catch {
        return null
    }
}

/**
 * Proxy an image URL into a response suitable for the Next.js image optimizer.
 * @param imageUrl - Resolved image URL.
 * @param fetchAdapter - Fetch adapter for tests or runtime.
 * @returns Image response, or an error response.
 */
export async function proxyThumbnailImage(imageUrl: string, fetchAdapter: ThumbnailFetch = fetch): Promise<Response> {
    const imageResponse = await fetchAdapter(imageUrl, {
        headers: { 'User-Agent': BROWSER_USER_AGENT },
        next: { revalidate: 31 * 24 * 3600 },
    })

    if (!imageResponse.ok) {
        return new Response('Failed to fetch thumbnail image', { status: imageResponse.status })
    }

    return new Response(imageResponse.body, {
        headers: {
            'Content-Type': imageResponse.headers.get('Content-Type') ?? 'image/jpeg',
            'Cache-Control': 'public, max-age=2678400, stale-while-revalidate=2678400',
        },
    })
}

/**
 * Resolve direct YouTube video thumbnails.
 * @param parsed - Parsed media URL.
 * @returns YouTube thumbnail URL, or null.
 */
function resolveYoutubeVideoThumbnail(parsed: URL): string | null {
    if (parsed.hostname === 'youtu.be') {
        const videoId = parsed.pathname.slice(1)
        return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
    }

    if (!parsed.hostname.includes('youtube.com')) {
        return null
    }

    const videoId = parsed.searchParams.get('v')
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
}

/**
 * Resolve YouTube playlist thumbnail through the Google API.
 * @param parsed - Parsed media URL.
 * @param fetchAdapter - Fetch adapter.
 * @returns Playlist thumbnail URL, or null.
 */
async function resolveYoutubePlaylistThumbnail(parsed: URL, fetchAdapter: ThumbnailFetch): Promise<string | null> {
    if (!parsed.hostname.includes('youtube.com')) {
        return null
    }

    const listId = parsed.searchParams.get('list')
    const apiKey = process.env.GOOGLE_API_KEY
    if (!listId || !apiKey) {
        return null
    }

    const googleApiUrl = new URL('https://www.googleapis.com/youtube/v3/playlists')
    googleApiUrl.searchParams.set('part', 'snippet')
    googleApiUrl.searchParams.set('id', listId)
    googleApiUrl.searchParams.set('key', apiKey)

    const response = await fetchAdapter(googleApiUrl.toString(), {
        next: { revalidate: 31 * 24 * 3600 },
    })
    const data = (await response.json()) as GoogleApiPlaylistResponse

    return data.items?.[0]?.snippet?.thumbnails?.high?.url ?? null
}

/**
 * Resolve Open Graph thumbnail from a generic media page.
 * @param mediaLink - Media page URL.
 * @param fetchAdapter - Fetch adapter.
 * @returns Open Graph image URL, or null.
 */
async function resolveOpenGraphThumbnail(mediaLink: string, fetchAdapter: ThumbnailFetch): Promise<string | null> {
    const response = await fetchAdapter(mediaLink, {
        headers: { 'User-Agent': BROWSER_USER_AGENT },
        next: { revalidate: 31 * 24 * 3600 },
    })

    // Bail out early: parsing an error page for og:image silently yields null and hides the real failure.
    if (!response.ok) {
        return null
    }

    const html = await response.text()
    const match =
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/.exec(html) ??
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/.exec(html)

    return match?.[1] ?? null
}
