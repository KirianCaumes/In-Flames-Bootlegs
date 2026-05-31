import { fetchShows } from 'lib/shows'
import type { NextRequest } from 'next/server'

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
 * GET /thumbnail/{url}
 * @param _req - NextRequest containing the media URL as a query parameter
 * @returns JSON response with the thumbnail URL or an error message
 */
export async function GET(
    _req: NextRequest,
    {
        params,
    }: {
        /** The route parameters */
        readonly params: Promise<{
            /** Slug of the show ("Id-Title") */
            readonly slug: string
        }>
    },
) {
    const resolved = await params
    const { slug } = resolved

    if (!slug) {
        return new Response('Missing slug parameter', { status: 400 })
    }

    const id = slug.split('-')[0]

    if (!id) {
        return new Response('Missing id parameter', { status: 400 })
    }

    const shows = await fetchShows()
    const show = shows.find(s => s.Id.toString() === id)

    if (!show) {
        return new Response('Show not found in shows archive', { status: 404 })
    }

    const thumbnail = await resolveThumbnail(show.Link)

    if (!thumbnail) {
        return new Response('Thumbnail not found', { status: 404 })
    }

    const imageRes = await fetch(thumbnail, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
        next: { revalidate: 31 * 24 * 3600 }, // Every 31 days
    })

    if (!imageRes.ok) {
        return new Response('Failed to fetch thumbnail image', { status: imageRes.status })
    }

    return new Response(imageRes.body, {
        headers: {
            'Content-Type': imageRes.headers.get('Content-Type') ?? 'image/jpeg',
            // Not useful when the image is served from the Next.js image optimization API "<Image />" component, but still good for direct access
            'Cache-Control': 'public, max-age=2678400, stale-while-revalidate=2678400',
        },
    })
}
