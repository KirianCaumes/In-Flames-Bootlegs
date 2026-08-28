import { getCachedSheetValues } from 'lib/google/sheets'
import { parseMiscPerformances, type MiscPerformance } from 'lib/miscellaneous/performances'

/** Range fetched from the Google Sheet. The tab is named "Various" even though the page is called Miscellaneous. */
const RANGE_DATA = 'Various!A1:H9999'

/**
 * Fetch normalized miscellaneous performances from the Google Sheet.
 * Server-only: pulls in google-auth-library, so it must never be imported by client components.
 * @param range Display range to fetch.
 * @returns Promise resolving to all performances, oldest first.
 */
export async function fetchMiscPerformances(range = RANGE_DATA): Promise<Array<MiscPerformance>> {
    // Parsing stays outside the cache: unstable_cache stores JSON, which would flatten the parsed Date fields into strings.
    return parseMiscPerformances(await getCachedSheetValues(range))
}
