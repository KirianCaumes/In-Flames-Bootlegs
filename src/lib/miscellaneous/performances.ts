import { DELETED_TITLE_PREFIX } from 'lib/archive/shows'
import { formatSheetDate, parseSheetDate } from 'lib/sheet-date'
import { hashMediaLink, MISC_ID_PREFIX } from 'lib/sheet-id'
import type { GoogleApiResponse } from 'lib/google/sheets'

/** Raw performance row keyed by Google Sheet headers. */
type RawPerformanceRow = Partial<Record<string, string>>

/** Media availability flags for a miscellaneous performance. */
export interface MiscPerformanceAvailability {
    /** Whether professionally recorded video footage exists. */
    readonly hasProShot: boolean
    /** Whether any video footage exists. */
    readonly hasVideo: boolean
}

/**
 * A one-off In Flames performance outside a regular concert: award ceremony, radio session, or guest feature.
 */
export interface MiscPerformance {
    /** Stable identifier: {@link MISC_ID_PREFIX} then {@link hashMediaLink} of the link. Rows are deduplicated by link, so it is unique. */
    readonly id: string
    /** Title as written in the sheet. */
    readonly title: string
    /** Parsed performance date, or null when the sheet value is invalid. */
    readonly date: Date | null
    /** Event, show, or ceremony the performance took place at. */
    readonly event: string
    /** Songs performed. */
    readonly songs: Array<string>
    /** Media availability flags. */
    readonly availability: MiscPerformanceAvailability
    /** Primary media link, either a single video or a playlist. */
    readonly mediaLink: string
    /** Additional notes, usually the details of a guest feature. */
    readonly comment: string
}

/**
 * Get the year for a miscellaneous performance.
 * @param performance - Performance to read.
 * @returns Year, or null when unavailable.
 */
export function getMiscPerformanceYear(performance: MiscPerformance): number | null {
    return performance.date ? performance.date.getFullYear() : null
}

/**
 * Format a miscellaneous performance's date for display.
 * @param performance - Performance to format the date for.
 * @returns Formatted date, or 'Unknown date' when unavailable.
 */
export function getMiscPerformanceDateDisplay(performance: MiscPerformance): string {
    return formatSheetDate(performance.date)
}

/**
 * Build descriptive alt text for a performance thumbnail, e.g. "Alias - In Flames at Grammisgalan - Jan 7, 2009".
 * The songs lead: they only appear over the still, inside a link whose aria-label would otherwise hide them.
 * @param performance - Performance to describe.
 * @returns Descriptive alt text.
 */
export function getMiscPerformanceImageAlt(performance: MiscPerformance): string {
    const place = ['In Flames', performance.event].filter(Boolean).join(' at ')
    const parts = [performance.songs.join(' / '), place, performance.date ? getMiscPerformanceDateDisplay(performance) : '']
    return parts.filter(Boolean).join(' - ')
}

/**
 * Build a label identifying a performance in analytics events.
 * @param performance - Performance to label.
 * @returns Analytics title.
 */
export function getMiscPerformanceAnalyticsTitle(performance: MiscPerformance): string {
    return [performance.event, performance.date ? getMiscPerformanceDateDisplay(performance) : '-'].filter(Boolean).join(' ')
}

/**
 * Build the local thumbnail path for a miscellaneous performance.
 * The leading id is what `/thumbnail/[slug]` reads back to resolve the media link server-side.
 * @param performance - Performance to represent.
 * @returns Local thumbnail path.
 */
export function buildMiscThumbnailPath(performance: MiscPerformance): string {
    return `/thumbnail/${performance.id} - In Flames - ${performance.event} - ${getMiscPerformanceDateDisplay(performance)}`
}

/**
 * Parse a Google Sheets response into normalized miscellaneous performances, oldest first.
 * @param raw - Raw values from the Sheets API.
 * @returns Normalized performances, oldest first.
 */
export function parseMiscPerformances(raw: GoogleApiResponse): Array<MiscPerformance> {
    const rows = raw.values
    if (!rows || rows.length < 2) {
        return []
    }

    const headers = rows[0].map(header => header.trim())
    // Keeps one row per link: a repeated link means the same media entered twice, and both rows would share an id.
    const seenLinks = new Set<string>()

    return (
        rows
            .slice(1)
            .map(row => Object.fromEntries(headers.map((header, columnIndex) => [header, (row[columnIndex] ?? '').trim()])))
            .filter(row => row.Title && !row.Title.startsWith(DELETED_TITLE_PREFIX))
            .filter(row => {
                if (seenLinks.has(row.Link)) {
                    return false
                }
                seenLinks.add(row.Link)

                return true
            })
            .map(row => normalizePerformance(row))
            // Oldest first, like the archive's default sort. Undated rows go last: MAX_SAFE_INTEGER also keeps them in sheet order.
            .toSorted((a, b) => (a.date?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.date?.getTime() ?? Number.MAX_SAFE_INTEGER))
    )
}

/**
 * Normalize a raw Google Sheet row into a miscellaneous performance.
 * @param row - Raw row keyed by headers.
 * @returns Normalized performance.
 */
function normalizePerformance(row: RawPerformanceRow): MiscPerformance {
    const mediaLink = row.Link ?? ''
    return {
        id: `${MISC_ID_PREFIX}${hashMediaLink(mediaLink)}`,
        title: row.Title ?? '',
        date: parseSheetDate(row.Date ?? ''),
        event: row.Event ?? '',
        songs: (row['Song(s)'] ?? '')
            .split('\n')
            .map(song => song.trim())
            .filter(Boolean),
        availability: {
            hasProShot: row.ProShot === 'Yes',
            hasVideo: row.Video === 'Yes',
        },
        mediaLink,
        comment: row.Comment ?? '',
    }
}
