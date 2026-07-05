import { getGoogleAccessToken } from 'lib/google/auth'
import { parseArchiveShows, type ArchiveShow, type GoogleApiResponse } from 'lib/archive/shows'

/** Default display range fetched from the archive Google Sheet. */
const RANGE_DATA = 'Live show!A1:N9999'

/**
 * Fetch normalized archive shows from the Google Sheet.
 * Server-only: pulls in google-auth-library, so it must never be imported by client components.
 * @param range Display range to fetch.
 * @returns Promise resolving to all archive shows.
 */
export async function fetchArchiveShows(range = RANGE_DATA): Promise<Array<ArchiveShow>> {
    const sheetId = process.env.GOOGLE_SHEET_ID
    if (!sheetId) {
        throw new Error('Missing Google Sheets configuration')
    }

    const accessToken = await getGoogleAccessToken()

    const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`)

    const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
        next: { revalidate: 3600 },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch archive: HTTP ${response.status}`)
    }

    const raw = (await response.json()) as GoogleApiResponse

    return parseArchiveShows(raw)
}
