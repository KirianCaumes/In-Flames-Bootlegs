const RANGE_DATA = 'Live show!A1:K9999'
const DELETED_TITLE_PREFIX = '💀'

/** Raw Google Sheet response shape for the bootlegs archive. */
interface GoogleApiResponse {
    /** Range returned by Google Sheets. */
    range: string
    /** Major dimension returned by Google Sheets. */
    majorDimension: string
    /** Row values returned by Google Sheets. */
    values?: Array<Array<string>>
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
    /** Stable identifier base on the timestamp. */
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
 * Format an archive show's date for display.
 * @param show - Show to format the date for.
 * @returns Formatted date, or 'Unknown date' when unavailable.
 */
export function getArchiveShowDateDisplay(show: ArchiveShow): string {
    if (!show.date) {
        return 'Unknown date'
    }
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(show.date)
}

/**
 * Normalize a raw Google Sheet row into an archive show.
 * @param row - Raw row keyed by headers.
 * @returns Normalized archive show.
 */
function normalizeShow(row: RawShowRow): ArchiveShow {
    const dateText = row.Date ?? ''
    const date = parseArchiveDate(dateText)
    return {
        id: date ? date.getTime() : 0,
        title: row.Title ?? '',
        dateText,
        date,
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
export function parseArchiveShows(raw: GoogleApiResponse): Array<ArchiveShow> {
    const rows = raw.values
    if (!rows || rows.length < 2) {
        return []
    }

    const headers = rows[0].map(header => header.trim())
    return rows
        .slice(1)
        .map(row => {
            const rawRow = Object.fromEntries(headers.map((header, rowIndex) => [header, (row[rowIndex] ?? '').trim()]))
            return normalizeShow(rawRow)
        })
        .filter(show => show.title && !show.title.startsWith(DELETED_TITLE_PREFIX))
}

/**
 * Fetch normalized archive shows from the Google Sheet.
 * @param range Display range to fetch.
 * @returns Promise resolving to all archive shows.
 */
export async function fetchArchiveShows(range = RANGE_DATA): Promise<Array<ArchiveShow>> {
    const sheetId = process.env.GOOGLE_SHEET_ID
    const apiKey = process.env.GOOGLE_API_KEY
    if (!sheetId || !apiKey) {
        throw new Error('Missing Google Sheets configuration')
    }

    const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`)
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString(), { next: { revalidate: 3600 } })

    if (!response.ok) {
        throw new Error(`Failed to fetch archive: HTTP ${response.status}`)
    }

    const raw = (await response.json()) as GoogleApiResponse

    return parseArchiveShows(raw)
}
