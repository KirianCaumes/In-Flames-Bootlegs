import { cache } from 'react'
import { getCachedSheetValues } from 'lib/google/sheets'
import { parseArchiveShows, type ArchiveShow } from 'lib/archive/shows'

/** Default display range fetched from the archive Google Sheet. */
const RANGE_DATA = 'Live show!A1:N9999'

/**
 * Fetch normalized archive shows from the Google Sheet.
 * Memoized per request: the sections layout (tab counts) and the page both call it, and only the first call reads and parses.
 * Server-only: pulls in google-auth-library, so it must never be imported by client components.
 * @param range Display range to fetch.
 * @returns Promise resolving to all archive shows.
 */
export const fetchArchiveShows = cache(
    async (range = RANGE_DATA): Promise<Array<ArchiveShow>> =>
        // Parsing stays outside unstable_cache, which stores JSON and would flatten the parsed Date fields into strings.
        // React's cache() is per request and keeps real objects, so the layout and the page share one parsed list.
        parseArchiveShows(await getCachedSheetValues(range)),
)
