/**
 * Normalize text for free-text search: lowercase, accents stripped, so "goteborg" finds "Göteborg".
 * @param text - Text to normalize.
 * @returns Normalized text.
 */
export function normalizeSearchText(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
}

/**
 * Determine whether a normalized haystack matches a free-text query.
 * Every word of the query must appear somewhere in the haystack, in any order, so "wacken 2008" matches a show
 * whose festival is Wacken and whose date is in 2008.
 * @param haystack - Text already passed through {@link normalizeSearchText}.
 * @param query - Raw query typed by the user.
 * @returns True when every query word is found, or when the query is blank.
 */
export function matchesSearch(haystack: string, query: string): boolean {
    return normalizeSearchText(query)
        .split(/\s+/)
        .filter(Boolean)
        .every(word => haystack.includes(word))
}
