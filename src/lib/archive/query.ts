import { getArchiveShowYear, type ArchiveShow } from 'lib/archive/shows'

/** Sort order for archive show dates. */
export type ArchiveSortOrder = 'date-asc' | 'date-desc'

/** Query state for the bootlegs archive. */
export interface ArchiveQuery {
    /** Year filter. */
    readonly year: string
    /** Country filter. */
    readonly country: string
    /** City search text. */
    readonly city: string
    /** Song search text. */
    readonly song: string
    /** Pro shot filter. */
    readonly proshot: boolean
    /** Video filter. */
    readonly video: boolean
    /** Full show filter. */
    readonly full: boolean
    /** Date sort order. */
    readonly sort: ArchiveSortOrder
}

/** Search facets derived from archive shows. */
export interface ArchiveFacets {
    /** Available years. */
    readonly years: Array<string>
    /** Available countries. */
    readonly countries: Array<string>
    /** Available cities. */
    readonly cities: Array<string>
    /** Available songs. */
    readonly songs: Array<string>
}

/** URL search parameter reader used by archive query parsing. */
interface ArchiveQueryParams {
    /**
     * Read one parameter value.
     * @param key - Parameter name.
     * @returns Parameter value, or null when absent.
     */
    readonly get: (key: string) => string | null
}

/** Default archive query. */
export const DEFAULT_ARCHIVE_QUERY: ArchiveQuery = {
    year: '',
    country: '',
    city: '',
    song: '',
    proshot: false,
    video: false,
    full: false,
    sort: 'date-asc',
}

/**
 * Parse URL search parameters into an archive query.
 * @param params - URLSearchParams-like reader.
 * @returns Archive query.
 */
export function parseArchiveQuery(params: ArchiveQueryParams): ArchiveQuery {
    const sort = params.get('sort')

    return {
        year: params.get('year') ?? DEFAULT_ARCHIVE_QUERY.year,
        country: params.get('country') ?? DEFAULT_ARCHIVE_QUERY.country,
        city: params.get('city') ?? DEFAULT_ARCHIVE_QUERY.city,
        song: params.get('song') ?? DEFAULT_ARCHIVE_QUERY.song,
        proshot: params.get('proshot') === '1',
        video: params.get('video') === '1',
        full: params.get('full') === '1',
        sort: sort === 'date-desc' ? sort : DEFAULT_ARCHIVE_QUERY.sort,
    }
}

/**
 * Serialize an archive query into URL search parameters.
 * @param query - Archive query to serialize.
 * @returns URL search parameter string.
 */
export function serializeArchiveQuery(query: ArchiveQuery): string {
    const params = new URLSearchParams()

    if (query.year) {
        params.set('year', query.year)
    }
    if (query.country) {
        params.set('country', query.country)
    }
    if (query.city) {
        params.set('city', query.city)
    }
    if (query.song) {
        params.set('song', query.song)
    }
    if (query.proshot) {
        params.set('proshot', '1')
    }
    if (query.video) {
        params.set('video', '1')
    }
    if (query.full) {
        params.set('full', '1')
    }
    if (query.sort !== DEFAULT_ARCHIVE_QUERY.sort) {
        params.set('sort', query.sort)
    }

    return params.toString()
}

/**
 * Apply an archive query to shows.
 * @param shows - Shows to filter and sort.
 * @param query - Query to apply.
 * @returns Filtered and sorted shows.
 */
export function applyArchiveQuery(shows: Array<ArchiveShow>, query: ArchiveQuery): Array<ArchiveShow> {
    return shows
        .filter(show => matchesArchiveQuery(show, query))
        .toSorted((a, b) => {
            const left = a.date?.getTime() ?? 0
            const right = b.date?.getTime() ?? 0
            return query.sort === 'date-asc' ? left - right : right - left
        })
}

/**
 * Build filter facets from archive shows.
 * @param shows - Shows to inspect.
 * @returns Facets for filter controls.
 */
export function buildArchiveFacets(shows: Array<ArchiveShow>): ArchiveFacets {
    const songs = new Map<string, string>()
    shows
        .flatMap(show => show.songs)
        .forEach(song => {
            const key = song.toLowerCase()
            if (!songs.has(key)) {
                songs.set(key, song)
            }
        })

    return {
        years: uniqueSorted(shows.map(s => getArchiveShowYear(s)?.toString() ?? null).filter((year): year is string => year !== null)),
        countries: uniqueSorted(shows.map(show => show.country.trim()).filter(Boolean)),
        cities: uniqueSorted(shows.map(show => show.city.trim()).filter(Boolean)),
        songs: [...songs.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    }
}

/**
 * Determine whether an archive query has active filtering.
 * @param query - Query to inspect.
 * @returns True when any non-sort filter is active.
 */
export function isArchiveQueryActive(query: ArchiveQuery): boolean {
    return query.year !== '' || query.country !== '' || query.city !== '' || query.song !== '' || query.proshot || query.video || query.full
}

/**
 * Patch one archive query field.
 * @param query - Current query.
 * @param key - Query field to update.
 * @param value - New field value.
 * @returns Updated query.
 */
export function patchArchiveQuery<K extends keyof ArchiveQuery>(query: ArchiveQuery, key: K, value: ArchiveQuery[K]): ArchiveQuery {
    return { ...query, [key]: value }
}

/**
 * Determine whether a show matches a query.
 * @param show - Show to inspect.
 * @param query - Query to apply.
 * @returns True when the show matches.
 */
function matchesArchiveQuery(show: ArchiveShow, query: ArchiveQuery): boolean {
    if (query.year && getArchiveShowYear(show)?.toString() !== query.year) {
        return false
    }
    if (query.country && show.country.trim() !== query.country) {
        return false
    }
    if (query.city && !show.city.toLowerCase().includes(query.city.toLowerCase())) {
        return false
    }
    if (query.song && !show.songs.some(song => song.toLowerCase().includes(query.song.toLowerCase()))) {
        return false
    }
    if (query.proshot && !show.availability.hasProShot) {
        return false
    }
    if (query.video && !show.availability.hasVideo) {
        return false
    }
    if (query.full && !show.availability.isFullShow) {
        return false
    }

    return true
}

/**
 * Get unique sorted values.
 * @param values - Values to deduplicate.
 * @returns Unique sorted values.
 */
function uniqueSorted(values: Array<string>): Array<string> {
    return [...new Set(values)].sort()
}
