import { type NextRequest, NextResponse } from 'next/server'
import { fetchShows } from '@/lib/shows'

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
            if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            const listId = parsed.searchParams.get('list')
            if (listId) {
                const apiKey = process.env.YOUTUBE_API_KEY
                if (!apiKey) return null
                const res = await fetch(
                    `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(listId)}&key=${encodeURIComponent(apiKey)}`,
                    { next: { revalidate: 86400 } },
                )
                const data = await res.json()
                return (data?.items?.[0]?.snippet?.thumbnails?.high?.url as string) ?? null
            }
        }
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
            next: { revalidate: 86400 },
        })
        const html = await res.text()
        const match =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/) ??
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/)
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
    if (!url) return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })

    const shows = await fetchShows()
    const allowedUrls = new Set(shows.map(s => s.Link).filter(Boolean))
    if (!allowedUrls.has(url)) return NextResponse.json({ error: 'URL not found in shows archive' }, { status: 404 })

    const thumbnail = await resolveThumbnail(url)
    if (!thumbnail) return NextResponse.json({ error: 'Thumbnail not found' }, { status: 404 })

    return NextResponse.json(
        { thumbnail },
        {
            headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' },
        },
    )
}
