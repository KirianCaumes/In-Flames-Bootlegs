import { fetchArchiveShows } from 'lib/archive/fetch-shows'
import { proxyThumbnailImage, resolveMediaThumbnail } from 'lib/archive/thumbnails'
import type { NextRequest } from 'next/server'

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

    const id = slug.split(' - ')[0]

    if (!id) {
        return new Response('Missing id parameter', { status: 400 })
    }

    const shows = await fetchArchiveShows()
    const show = shows.find(s => s.id.toString() === id)

    if (!show) {
        return new Response('Show not found in shows archive', { status: 404 })
    }

    const thumbnail = await resolveMediaThumbnail(show.mediaLink)

    if (!thumbnail) {
        return new Response('Thumbnail not found', { status: 404 })
    }

    return proxyThumbnailImage(thumbnail)
}
