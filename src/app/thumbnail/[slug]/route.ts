import { fetchArchiveShows } from 'lib/archive/fetch-shows'
import { proxyThumbnailImage, resolveMediaThumbnail } from 'lib/archive/thumbnails'
import { fetchMiscPerformances } from 'lib/miscellaneous/fetch-performances'
import { MISC_ID_PREFIX, SHOW_ID_PREFIX } from 'lib/sheet-id'
import type { NextRequest } from 'next/server'

/** The part of a sheet entry this route needs: both sheets satisfy it. */
interface ThumbnailEntry {
    /** Prefixed id of the entry. */
    readonly id: string
    /** Link whose thumbnail is served. */
    readonly mediaLink: string
}

/**
 * Fetch the entries of the sheet an id belongs to, chosen by its prefix.
 * @param id - Leading segment of the thumbnail slug.
 * @returns Entries to look the id up in, or null when the prefix names no sheet.
 */
async function fetchEntriesForId(id: string): Promise<Array<ThumbnailEntry> | null> {
    if (id.startsWith(MISC_ID_PREFIX)) {
        return fetchMiscPerformances()
    }

    if (id.startsWith(SHOW_ID_PREFIX)) {
        return fetchArchiveShows()
    }

    return null
}

/**
 * GET /thumbnail/{id - description}
 * Resolves the id against its sheet and proxies the resulting thumbnail. The media link is never read from the
 * URL, so this route cannot be used to proxy arbitrary images.
 * @param _req - NextRequest, unused: everything needed is in the slug.
 * @returns The proxied thumbnail image, or an error response.
 */
export async function GET(
    _req: NextRequest,
    {
        params,
    }: {
        /** The route parameters */
        readonly params: Promise<{
            /** Slug of the entry ("Id - Description") */
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

    const entries = await fetchEntriesForId(id)

    if (!entries) {
        return new Response(`Unknown id prefix: expected "${MISC_ID_PREFIX}" or "${SHOW_ID_PREFIX}"`, { status: 400 })
    }

    const mediaLink = entries.find(entry => entry.id === id)?.mediaLink

    if (!mediaLink) {
        return new Response('Entry not found in archive', { status: 404 })
    }

    const thumbnail = await resolveMediaThumbnail(mediaLink)

    if (!thumbnail) {
        return new Response('Thumbnail not found', { status: 404 })
    }

    return proxyThumbnailImage(thumbnail)
}
