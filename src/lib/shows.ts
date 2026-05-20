/**
 * Represents a concert show in the In-Flames archive.
 * Maps directly to columns from the Google Sheet data source.
 */
export interface Show {
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
 * Parses CSV data into an array of Show objects.
 * Handles quoted fields and properly escaped quotes within fields.
 * @param raw - Raw CSV text data
 * @returns Array of parsed Show objects
 */
function parseCSV(raw: string): Show[] {
    // Normalize line endings to \n for consistent parsing
    const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const rows: string[][] = []
    let i = 0
    const len = text.length

    while (i < len) {
        const row: string[] = []

        while (i < len && !(text[i] === '\n' && row.length > 0)) {
            if (text[i] === ',') i++
            else if (row.length === 0 && text[i] === '\n') break

            if (i >= len) break

            if (text[i] === '"') {
                i++ // skip opening quote
                let field = ''
                while (i < len) {
                    if (text[i] === '"') {
                        if (text[i + 1] === '"') {
                            field += '"'
                            i += 2
                        } else {
                            i++
                            break
                        }
                    } else {
                        field += text[i++]
                    }
                }
                row.push(field)
            } else {
                let field = ''
                while (i < len && text[i] !== ',' && text[i] !== '\n') {
                    field += text[i++]
                }
                row.push(field.trim())
            }
        }

        if (i < len && text[i] === '\n') i++
        if (row.length > 0) rows.push(row)
    }

    if (rows.length < 2) return []

    const headers = rows[0].map(h => h.trim())
    return rows
        .slice(1)
        .map(row => {
            const obj: Record<string, string> = {}
            headers.forEach((h, idx) => {
                obj[h] = (row[idx] || '').trim()
            })
            return obj as unknown as Show
        })
        .filter(s => s.Title)
}
/**
 * Fetches the concert shows from the Google Sheet and parses the CSV data.
 * Results are cached and revalidated every hour (3600 seconds).
 * @throws {Error} If the fetch fails or returns a non-OK status
 * @returns Promise resolving to an array of all concert shows
 */ export async function fetchShows(): Promise<Show[]> {
    const res = await fetch(process.env.GOOGLE_SHEET_URL!, {
        next: { revalidate: 3600 }, // revalidate every hour
    })
    if (!res.ok) throw new Error(`Failed to fetch archive: HTTP ${res.status}`)
    const text = await res.text()
    return parseCSV(text)
}
