import { formatSheetDate, parseSheetDate, toIsoDate } from 'lib/sheet-date'
import { hashMediaLink, SHOW_ID_PREFIX } from 'lib/sheet-id'
import type { GoogleApiResponse } from 'lib/google/sheets'

/** Prefix marking a sheet row as deleted, kept in the document for history but excluded from the archive. */
export const DELETED_TITLE_PREFIX = '💀'

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
    /** Stable identifier: {@link SHOW_ID_PREFIX} then {@link hashMediaLink} of the link. Rows are deduplicated by link, so it is unique. */
    readonly id: string
    /** Parsed show date, or null when the sheet value is invalid. */
    readonly date: Date | null
    /** City where the concert took place. */
    readonly city: string
    /** Country where the concert took place. */
    readonly country: string
    /** Venue where the concert took place. */
    readonly venue: string
    /** Festival the concert was part of, when applicable. */
    readonly festival: string
    /** Tour the concert belonged to, when applicable. */
    readonly tour: string
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
    return formatSheetDate(show.date)
}

/**
 * Build a human-readable "City, Country" location for a show, gracefully dropping missing parts.
 * @param show - Show to read.
 * @returns Location string, or 'Unknown location' when both city and country are missing.
 */
export function getArchiveShowLocation(show: ArchiveShow): string {
    const parts = [show.city, show.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Unknown location'
}

/**
 * Get the festival-or-venue label for a show: the festival name when set, otherwise the venue name.
 * @param show - Show to read.
 * @returns Festival name, venue name, or '' when neither is set.
 */
export function getArchiveShowVenue(show: ArchiveShow): string {
    return show.festival || show.venue
}

/**
 * Build descriptive alt text for a show thumbnail, e.g. "In Flames live in Gothenburg, Sweden - Jun 24, 1994".
 * @param show - Show to describe.
 * @returns Descriptive alt text.
 */
export function getArchiveShowImageAlt(show: ArchiveShow): string {
    const date = getArchiveShowDateDisplay(show)
    const datePart = show.date ? ` - ${date}` : ''
    return `In Flames live in ${getArchiveShowLocation(show)}${datePart}`
}

/**
 * Format a show's date as an ISO calendar date (YYYY-MM-DD).
 * @param show - Show to read.
 * @returns ISO date string, or null when the date is unavailable.
 */
export function getArchiveShowIsoDate(show: ArchiveShow): string | null {
    return toIsoDate(show.date)
}

/**
 * Normalize a raw Google Sheet row into an archive show.
 * @param row - Raw row keyed by headers.
 * @returns Normalized archive show.
 */
function normalizeShow(row: RawShowRow): ArchiveShow {
    const mediaLink = row.Link ?? ''
    return {
        id: `${SHOW_ID_PREFIX}${hashMediaLink(mediaLink)}`,
        date: parseSheetDate(row.Date ?? ''),
        city: row.City ?? '',
        country: row.Country ?? '',
        venue: row.Venue ?? '',
        festival: row.Festival ?? '',
        tour: row.Tour ?? '',
        songs: (row.Setlist ?? '')
            .split('\n')
            .map(song => song.trim())
            .filter(Boolean),
        availability: {
            hasProShot: row.ProShot === 'Yes',
            hasVideo: row.Video === 'Yes',
            isFullShow: row.Full === 'Yes',
        },
        mediaLink,
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
    // Keeps one row per link: a repeated link means the same media entered twice, and both rows would share an id.
    const seenLinks = new Set<string>()

    return rows
        .slice(1)
        .filter(row => row[0] && !row[0].startsWith(DELETED_TITLE_PREFIX))
        .map(row => Object.fromEntries(headers.map((header, columnIndex) => [header, (row[columnIndex] ?? '').trim()])))
        .filter(row => {
            if (seenLinks.has(row.Link)) {
                return false
            }
            seenLinks.add(row.Link)

            return true
        })
        .map(row => normalizeShow(row))
}
