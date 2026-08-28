/** Formatter for the archive's human-readable dates, built once since it is used on every row. */
const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
})

/**
 * Parse the DD/MM/YYYY date format used by every sheet of the archive Google Sheet.
 * @param dateText - Sheet date text.
 * @returns Parsed date, or null when invalid.
 */
export function parseSheetDate(dateText: string): Date | null {
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
 * Format a sheet date for display.
 * @param date - Date to format.
 * @returns Formatted date, or 'Unknown date' when unavailable.
 */
export function formatSheetDate(date: Date | null): string {
    return date ? dateFormatter.format(date) : 'Unknown date'
}

/**
 * Format a sheet date as an ISO calendar date (YYYY-MM-DD) using local parts to avoid timezone drift.
 * @param date - Date to format.
 * @returns ISO date string, or null when the date is unavailable.
 */
export function toIsoDate(date: Date | null): string | null {
    if (!date) {
        return null
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
