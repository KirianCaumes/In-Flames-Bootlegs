import { unstable_cache as unstableCache } from 'next/cache'
import { getGoogleAccessToken } from 'lib/google/auth'

/** Cache lifetime, in seconds, of the raw Google Sheet payload. */
const REVALIDATE = 3600

/** Cache tag allowing on-demand invalidation through `revalidateTag`. */
const CACHE_TAG = 'archive-shows'

/** Raw Google Sheet values response shape. */
export interface GoogleApiResponse {
    /** Range returned by Google Sheets. */
    range: string
    /** Major dimension returned by Google Sheets. */
    majorDimension: string
    /** Row values returned by Google Sheets. */
    values?: Array<Array<string>>
}

/**
 * Fetch the raw Google Sheet payload, uncached.
 * The Bearer token rotates hourly and takes part in the fetch cache key, so caching is done one level up by range only.
 * @param range Display range to fetch.
 * @returns Promise resolving to the raw Google Sheets values.
 */
async function fetchSheetValues(range: string): Promise<GoogleApiResponse> {
    const sheetId = process.env.GOOGLE_SHEET_ID
    if (!sheetId) {
        throw new Error('Missing Google Sheets configuration')
    }

    const accessToken = await getGoogleAccessToken()

    const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`)

    const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch archive: HTTP ${response.status}`)
    }

    return (await response.json()) as GoogleApiResponse
}

/**
 * Sheet payload cached for an hour, keyed by range only.
 * `unstable_cache` folds the arguments into the cache key, so one helper serves every sheet of the document without collision.
 * Once stale, the cached value is still served while a background refresh runs, so no visitor ever waits on Google Sheets.
 */
export const getCachedSheetValues = unstableCache(fetchSheetValues, [CACHE_TAG], { revalidate: REVALIDATE, tags: [CACHE_TAG] })
