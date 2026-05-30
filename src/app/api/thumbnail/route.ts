import { type NextRequest, NextResponse } from 'next/server'
import { fetchShows } from 'lib/shows'

interface GoogleApiPlaylistResponse {
    /** Kind */
    kind: string
    /** Etag */
    etag: string
    /** PageInfo */
    pageInfo: {
        /** TotalResults */
        totalResults: number
        /** ResultsPerPage */
        resultsPerPage: number
    }
    /** Items */
    items: Array<{
        /** Kind */
        kind: string
        /** Etag */
        etag: string
        /** Id */
        id: string
        /** Snippet */
        snippet: {
            /** PublishedAt */
            publishedAt: string
            /** ChannelId */
            channelId: string
            /** Title */
            title: string
            /** Description */
            description: string
            /** Thumbnails */
            thumbnails: {
                /** Default */
                default: {
                    /** Url */
                    url: string
                    /** Width */
                    width: number
                    /** Height */
                    height: number
                }
                /** Medium */
                medium: {
                    /** Url */
                    url: string
                    /** Width */
                    width: number
                    /** Height */
                    height: number
                }
                /** High */
                high: {
                    /** Url */
                    url: string
                    /** Width */
                    width: number
                    /** Height */
                    height: number
                }
                /** Standard */
                standard: {
                    /** Url */
                    url: string
                    /** Width */
                    width: number
                    /** Height */
                    height: number
                }
            }
            /** ChannelTitle */
            channelTitle: string
            /** Localized */
            localized: {
                /** Title */
                title: string
                /** Description */
                description: string
            }
        }
    }>
}

/**
 * Resolves a media URL to its thumbnail image URL.
 * Handles YouTube links (short URLs and playlists) and generic URLs via Open Graph metadata.
 * @param url - Media URL to resolve thumbnail for
 * @returns Thumbnail image URL or null if thumbnail cannot be found
 */
async function resolveThumbnail(url: string): Promise<string | null> {
    try {
        const parsed = new URL(url)
        if (parsed.hostname === 'youtu.be') {
            const videoId = parsed.pathname.slice(1)
            return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
        }
        if (parsed.hostname.includes('youtube.com')) {
            const videoId = parsed.searchParams.get('v')
            if (videoId) {
                return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            }
            const listId = parsed.searchParams.get('list')
            if (listId) {
                const apiKey = process.env.GOOGLE_API_KEY
                if (!apiKey) {
                    return null
                }
                const googleApiUrl = new URL('https://www.googleapis.com/youtube/v3/playlists')
                googleApiUrl.searchParams.set('part', 'snippet')
                googleApiUrl.searchParams.set('id', listId)
                googleApiUrl.searchParams.set('key', apiKey)

                const res = await fetch(googleApiUrl.toString(), {
                    next: { revalidate: 31 * 24 * 3600 }, // Every 31 days
                })

                const data = (await res.json()) as GoogleApiPlaylistResponse

                return data.items[0]?.snippet?.thumbnails?.high?.url ?? null
            }
        }
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
            next: { revalidate: 31 * 24 * 3600 }, // Every 31 days
        })
        const html = await res.text()
        const match =
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/.exec(html) ??
            /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/.exec(html)
        return match?.[1] ?? null
    } catch {
        return null
    }
}

/**
 * API endpoint that returns a thumbnail for a given show URL.
 * Validates that the URL exists in the shows archive before resolving the thumbnail.
 * Implements caching headers for optimal performance.
 * @param request - Next.js request object containing 'url' query parameter
 * @returns JSON response with thumbnail URL or error message with appropriate status code
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url')
    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
    }

    const shows = await fetchShows()
    const allowedUrls = new Set(shows.map(s => s.Link).filter(Boolean))
    if (!allowedUrls.has(url)) {
        return NextResponse.json({ error: 'URL not found in shows archive' }, { status: 404 })
    }

    const thumbnail = await resolveThumbnail(url)
    if (!thumbnail) {
        return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 })
    }

    return NextResponse.json(
        { thumbnail },
        {
            headers: { 'Cache-Control': 'public, max-age=2678400, stale-while-revalidate=86400' },
        },
    )
}
