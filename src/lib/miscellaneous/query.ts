import { getMiscPerformanceDateDisplay, getMiscPerformanceYear, type MiscPerformance } from 'lib/miscellaneous/performances'
import { matchesSearch, normalizeSearchText } from 'lib/search'
import type { ArchiveQueryParams, ArchiveSortOrder } from 'lib/archive/query'

/** Query state for the miscellaneous performances page. Lighter than the archive's: the section is small. */
export interface MiscQuery {
    /** Free-text search across every field of a performance. */
    readonly q: string
    /** Date sort order, shared with the archive. */
    readonly sort: ArchiveSortOrder
}

/** Default miscellaneous query. */
export const DEFAULT_MISC_QUERY: MiscQuery = { q: '', sort: 'date-asc' }

/**
 * Parse URL search parameters into a miscellaneous query.
 * @param params - URLSearchParams-like reader.
 * @returns Miscellaneous query.
 */
export function parseMiscQuery(params: ArchiveQueryParams): MiscQuery {
    return {
        q: params.get('q') ?? DEFAULT_MISC_QUERY.q,
        sort: params.get('sort') === 'date-desc' ? 'date-desc' : DEFAULT_MISC_QUERY.sort,
    }
}

/**
 * Serialize a miscellaneous query into URL search parameters.
 * @param query - Query to serialize.
 * @returns URL search parameter string.
 */
export function serializeMiscQuery(query: MiscQuery): string {
    const params = new URLSearchParams()
    if (query.q) {
        params.set('q', query.q)
    }
    if (query.sort !== DEFAULT_MISC_QUERY.sort) {
        params.set('sort', query.sort)
    }

    return params.toString()
}

/**
 * Apply a miscellaneous query to performances.
 * The input is expected oldest first (see `parseMiscPerformances`), so the descending order is its reverse,
 * which also keeps undated rows together at one end.
 * @param performances - Performances to filter, oldest first.
 * @param query - Query to apply.
 * @returns Filtered and sorted performances.
 */
export function applyMiscQuery(performances: Array<MiscPerformance>, query: MiscQuery): Array<MiscPerformance> {
    const filtered = query.q
        ? performances.filter(performance => matchesSearch(getMiscPerformanceSearchText(performance), query.q))
        : performances

    return query.sort === 'date-desc' ? filtered.toReversed() : filtered
}

/** Search text per performance, built once: the free-text filter runs on every keystroke. */
const searchTextCache = new WeakMap<MiscPerformance, string>()

/**
 * Get the normalized text the free-text search looks into.
 * @param performance - Performance to read.
 * @returns Normalized search text.
 */
function getMiscPerformanceSearchText(performance: MiscPerformance): string {
    let text = searchTextCache.get(performance)
    if (text === undefined) {
        text = normalizeSearchText(
            [
                performance.title,
                performance.event,
                getMiscPerformanceYear(performance)?.toString() ?? '',
                getMiscPerformanceDateDisplay(performance),
                performance.comment,
                ...performance.songs,
            ].join('\n'),
        )
        searchTextCache.set(performance, text)
    }

    return text
}
