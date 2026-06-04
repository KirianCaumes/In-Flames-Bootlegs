/** Raw Google Sheet response shape for the bootlegs archive. */
interface SheetResponse {
    /** Rows from the Google Sheet. */
    readonly values?: Array<Array<string>>
}

/** Raw show row keyed by Google Sheet headers. */
type RawShowRow = Partial<Record<string, string>>

/** Media availability flags for a show. */
export interface ShowAvailability {
    /** Whether professionally recorded video footage exists. */
    readonly hasProShot: boolean
    /** Whether any video footage exists. */
    readonly hasVideo: boolean
    /** Whether a complete show recording exists. */
    readonly isFullShow: boolean
}

/** Normalized concert show in the bootlegs archive. */
export interface ArchiveShow {
    /** Stable identifier from the Google Sheet row order. */
    readonly id: number
    /** Concert title/name. */
    readonly title: string
    /** Original date text from the Google Sheet. */
    readonly dateText: string
    /** Parsed show date, or null when the sheet value is invalid. */
    readonly date: Date | null
    /** City where the concert took place. */
    readonly city: string
    /** Country where the concert took place. */
    readonly country: string
    /** Setlist songs split from the sheet cell. */
    readonly songs: Array<string>
    /** Media availability flags. */
    readonly availability: ShowAvailability
    /** Primary media link. */
    readonly mediaLink: string
    /** Link to the Setlist.fm page. */
    readonly setlistFmLink: string
    /** Additional notes about the show. */
    readonly comment: string
}

const DELETED_TITLE_PREFIX = '💀'

/**
 * Parse the DD/MM/YYYY date format used by the archive Google Sheet.
 * @param dateText - Sheet date text.
 * @returns Parsed date, or null when invalid.
 */
export function parseArchiveDate(dateText: string): Date | null {
    if (!dateText) {
        return null
    }

    const [day, month, year] = dateText.split('/')
    if (!day || !month || !year) {
        return null
    }

    const parsed = new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, Number.parseInt(day, 10))
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Get the year for an archive show.
 * @param show - Show to read.
 * @returns Year as text, or null when unavailable.
 */
export function getArchiveShowYear(show: ArchiveShow): number | null {
    return show.date ? show.date.getFullYear() : null
}

/**
 * Normalize a raw Google Sheet row into an archive show.
 * @param row - Raw row keyed by headers.
 * @param id - Stable row identifier.
 * @returns Normalized archive show.
 */
function normalizeShow(row: RawShowRow, id: number): ArchiveShow {
    const dateText = row.Date ?? ''
    return {
        id,
        title: row.Title ?? '',
        dateText,
        date: parseArchiveDate(dateText),
        city: row.City ?? '',
        country: row.Country ?? '',
        songs: (row.Setlist ?? '')
            .split('\n')
            .map(song => song.trim())
            .filter(Boolean),
        availability: {
            hasProShot: row.ProShot === 'Yes',
            hasVideo: row.Video === 'Yes',
            isFullShow: row.Full === 'Yes',
        },
        mediaLink: row.Link ?? '',
        setlistFmLink: row['Setlist.fm'] ?? '',
        comment: row.Comment ?? '',
    }
}

/**
 * Parse a Google Sheets response into normalized archive shows.
 * @param raw - Raw JSON text from the Sheets API.
 * @returns Normalized archive shows.
 */
export function parseArchiveShows(raw: string): Array<ArchiveShow> {
    const data = JSON.parse(raw) as SheetResponse
    const rows = data.values
    if (!rows || rows.length < 2) {
        return []
    }

    const headers = rows[0].map(header => header.trim())
    return rows
        .slice(1)
        .map((row, index) => {
            const rawRow = Object.fromEntries(headers.map((header, rowIndex) => [header, (row[rowIndex] ?? '').trim()]))
            return normalizeShow(rawRow, index + 1)
        })
        .filter(show => show.title && !show.title.startsWith(DELETED_TITLE_PREFIX))
}

/**
 * Fetch normalized archive shows from the Google Sheet.
 * @returns Promise resolving to all archive shows.
 */
export async function fetchArchiveShows(): Promise<Array<ArchiveShow>> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const response = await fetch(`${process.env.GOOGLE_SHEET_URL!}?key=${process.env.GOOGLE_API_KEY!}`, {
        next: { revalidate: 3600 },
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch archive: HTTP ${response.status}`)
    }

    return parseArchiveShows(await response.text())
}
