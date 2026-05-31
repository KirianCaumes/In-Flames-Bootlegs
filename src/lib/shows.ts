/**
 * Represents a concert show in the In-Flames archive.
 * Maps directly to columns from the Google Sheet data source.
 */
export interface Show {
    /** Unique identifier for the show, based on the Google Sheet row */
    Id: number
    /** Concert title/name */
    Title: string
    /** Concert date in DD/MM/YYYY format */
    Date: string
    /** City where the concert took place */
    City: string
    /** Country where the concert took place */
    Country: string
    /** URL or info for the full setlist */
    Setlist: string
    /** Indicates if a professional shot video exists */
    ProShot: string
    /** Indicates if any video exists */
    Video: string
    /** Indicates if a full show video exists */
    Full: string
    /** Primary link to the video/media */
    Link: string
    /** Link to Setlist.fm page */
    'Setlist.fm': string
    /** Additional comments or notes about the show */
    Comment: string
}

/**
 * Parses a Google Sheets API v4 JSON response into an array of Show objects.
 * @param raw - Raw JSON text from the Sheets API
 * @returns Array of parsed Show objects
 */
function parseSheetJSON(raw: string): Array<Show> {
    const data = JSON.parse(raw) as {
        /** Array of rows from the Google Sheet, where each row is an array of cell values */
        values?: Array<Array<string>>
    }
    const rows = data.values
    if (!rows || rows.length < 2) {
        return []
    }

    const headers = rows[0].map(h => h.trim())
    return rows
        .slice(1)
        .map((row, i) => {
            const obj: Record<string, string | number> = {}
            headers.forEach((h, idx) => {
                obj[h] = (row[idx] || '').trim()
            })
            obj.Id = i + 1
            return obj as unknown as Show
        })
        .filter(s => s.Title && !s.Title.startsWith('💀')) // Filter out rows without a title or marked as deleted
}
/**
 * Fetches the concert shows from the Google Sheet and parses the CSV data.
 * Results are cached and revalidated every hour (3600 seconds).
 * @throws {Error} If the fetch fails or returns a non-OK status
 * @returns Promise resolving to an array of all concert shows
 */
export async function fetchShows(): Promise<Array<Show>> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const res = await fetch(`${process.env.GOOGLE_SHEET_URL!}?key=${process.env.GOOGLE_API_KEY!}`, {
        next: { revalidate: 3600 }, // Revalidate every hour
    })
    if (!res.ok) {
        throw new Error(`Failed to fetch archive: HTTP ${res.status}`)
    }
    const text = await res.text()
    return parseSheetJSON(text)
}
