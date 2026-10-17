import { cache } from 'react'
import { getCachedSheetValues } from 'lib/google/sheets'
import { parseMiscPerformances, type MiscPerformance } from 'lib/miscellaneous/performances'

/** Range fetched from the Google Sheet. The tab is named "Various" even though the page is called Miscellaneous. */
const RANGE_DATA = 'Various!A1:H9999'

/**
 * Fetch normalized miscellaneous performances from the Google Sheet.
 * Memoized per request: the sections layout (tab counts) and the page both call it, and only the first call reads and parses.
 * Server-only: pulls in google-auth-library, so it must never be imported by client components.
 * @param range Display range to fetch.
 * @returns Promise resolving to all performances, oldest first.
 */
export const fetchMiscPerformances = cache(
    async (range = RANGE_DATA): Promise<Array<MiscPerformance>> =>
        // Parsing stays outside unstable_cache, which stores JSON and would flatten the parsed Date fields into strings.
        // React's cache() is per request and keeps real objects, so the layout and the page share one parsed list.
        parseMiscPerformances(await getCachedSheetValues(range)),
)
