import { getCachedSheetValues } from 'lib/google/sheets'
import { parseArchiveShows, type ArchiveShow } from 'lib/archive/shows'

/** Default display range fetched from the archive Google Sheet. */
const RANGE_DATA = 'Live show!A1:N9999'

/**
 * Fetch normalized archive shows from the Google Sheet.
 * Server-only: pulls in google-auth-library, so it must never be imported by client components.
 * @param range Display range to fetch.
 * @returns Promise resolving to all archive shows.
 */
export async function fetchArchiveShows(range = RANGE_DATA): Promise<Array<ArchiveShow>> {
    // Parsing stays outside the cache: unstable_cache stores JSON, which would flatten the parsed Date fields into strings.
    return parseArchiveShows(await getCachedSheetValues(range))
}
