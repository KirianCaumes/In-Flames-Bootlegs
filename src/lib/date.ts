/** Formatter for displaying dates in short format (e.g., "Jan 15, 2024") */
const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
})

/**
 * Parses a date string in DD/MM/YYYY format into a Date object.
 * @param dateStr - Date string in DD/MM/YYYY format
 * @returns Date object or null if parsing fails
 */
function parseDateParts(dateStr: string): Date | null {
    if (!dateStr) {
        return null
    }
    const [d, m, y] = dateStr.split('/')
    if (!m || !d || !y) {
        return null
    }
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10))
    return isNaN(date.getTime()) ? null : date
}

/**
 * Extracts the year from a date string.
 * @param dateStr - Date string in DD/MM/YYYY format
 * @returns Year as a string, or null if date is invalid
 */
export function getYear(dateStr: string): string | null {
    const date = parseDateParts(dateStr)
    return date ? String(date.getFullYear()) : null
}

/**
 * Formats a date string into a readable format (e.g., "Jan 15, 2024").
 * @param dateStr - Date string in DD/MM/YYYY format
 * @returns Formatted date string or "—" if date is invalid
 */
export function formatDate(dateStr: string): string {
    const date = parseDateParts(dateStr)
    return date ? dateFormatter.format(date) : '—'
}

/**
 * Converts a date string to Unix timestamp in milliseconds.
 * @param dateStr - Date string in DD/MM/YYYY format
 * @returns Unix timestamp or 0 if date is invalid
 */
export function parseDate(dateStr: string): number {
    return parseDateParts(dateStr)?.getTime() ?? 0
}
