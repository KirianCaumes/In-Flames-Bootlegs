import { getArchiveShowDateDisplay, getArchiveShowVenue, getArchiveShowYear, type ArchiveShow } from 'lib/archive/shows'
import { matchesSearch, normalizeSearchText } from 'lib/search'

/** Sort order for archive show dates. */
export type ArchiveSortOrder = 'date-asc' | 'date-desc'

/** Query state for the bootlegs archive. */
export interface ArchiveQuery {
    /** Free-text search across every field of a show. */
    readonly q: string
    /** Year filter. */
    readonly year: string
    /** Country filter. */
    readonly country: string
    /** City search text. */
    readonly city: string
    /** Festival/venue search text. */
    readonly venue: string
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
    /** Available festivals/venues. */
    readonly venues: Array<string>
    /** Available songs. */
    readonly songs: Array<string>
}

/** URL search parameter reader used by archive query parsing. */
export interface ArchiveQueryParams {
    /**
     * Read one parameter value.
     * @param key - Parameter name.
     * @returns Parameter value, or null when absent.
     */
    readonly get: (key: string) => string | null
}

/** Default archive query. */
export const DEFAULT_ARCHIVE_QUERY: ArchiveQuery = {
    q: '',
    year: '',
    country: '',
    city: '',
    venue: '',
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
        q: params.get('q') ?? DEFAULT_ARCHIVE_QUERY.q,
        year: params.get('year') ?? DEFAULT_ARCHIVE_QUERY.year,
        country: params.get('country') ?? DEFAULT_ARCHIVE_QUERY.country,
        city: params.get('city') ?? DEFAULT_ARCHIVE_QUERY.city,
        venue: params.get('venue') ?? DEFAULT_ARCHIVE_QUERY.venue,
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

    if (query.q) {
        params.set('q', query.q)
    }
    if (query.year) {
        params.set('year', query.year)
    }
    if (query.country) {
        params.set('country', query.country)
    }
    if (query.city) {
        params.set('city', query.city)
    }
    if (query.venue) {
        params.set('venue', query.venue)
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
        venues: uniqueSorted(shows.map(show => getArchiveShowVenue(show).trim()).filter(Boolean)),
        songs: [...songs.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    }
}

/**
 * Determine whether an archive query has active filtering.
 * @param query - Query to inspect.
 * @returns True when any non-sort filter is active.
 */
export function isArchiveQueryActive(query: ArchiveQuery): boolean {
    return (
        query.q !== '' ||
        query.year !== '' ||
        query.country !== '' ||
        query.city !== '' ||
        query.venue !== '' ||
        query.song !== '' ||
        query.proshot ||
        query.video ||
        query.full
    )
}

/** Filters that can be toggled off one by one, with the label of their chip. */
export interface ArchiveQueryChip {
    /** Query field the chip clears. */
    readonly key: Exclude<keyof ArchiveQuery, 'sort'>
    /** Chip label. */
    readonly label: string
}

/**
 * List the active filters of a query, in the order of the filter panel.
 * @param query - Query to inspect.
 * @returns One chip per active filter.
 */
export function getArchiveQueryChips(query: ArchiveQuery): Array<ArchiveQueryChip> {
    const chips: Array<ArchiveQueryChip | null> = [
        query.q ? { key: 'q', label: `"${query.q}"` } : null,
        query.year ? { key: 'year', label: query.year } : null,
        query.country ? { key: 'country', label: query.country } : null,
        query.city ? { key: 'city', label: `City: ${query.city}` } : null,
        query.venue ? { key: 'venue', label: `Venue: ${query.venue}` } : null,
        query.song ? { key: 'song', label: `Song: ${query.song}` } : null,
        query.proshot ? { key: 'proshot', label: 'Pro Shot' } : null,
        query.video ? { key: 'video', label: 'Has Video' } : null,
        query.full ? { key: 'full', label: 'Full Show' } : null,
    ]

    return chips.filter(chip => chip !== null)
}

/**
 * Clear one filter of a query.
 * @param query - Current query.
 * @param key - Filter to clear.
 * @returns Updated query.
 */
export function clearArchiveQueryField(query: ArchiveQuery, key: ArchiveQueryChip['key']): ArchiveQuery {
    return { ...query, [key]: DEFAULT_ARCHIVE_QUERY[key] }
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
    if (query.q && !matchesSearch(getArchiveShowSearchText(show), query.q)) {
        return false
    }
    if (query.year && getArchiveShowYear(show)?.toString() !== query.year) {
        return false
    }
    if (query.country && show.country.trim() !== query.country) {
        return false
    }
    if (query.city && !show.city.toLowerCase().includes(query.city.toLowerCase())) {
        return false
    }
    if (query.venue && !getArchiveShowVenue(show).toLowerCase().includes(query.venue.toLowerCase())) {
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

/** Search text per show, built once: the free-text filter runs on every keystroke. */
const searchTextCache = new WeakMap<ArchiveShow, string>()

/**
 * Get the normalized text the free-text search looks into: location, venue, tour, date, notes and setlist.
 * @param show - Show to read.
 * @returns Normalized search text.
 */
function getArchiveShowSearchText(show: ArchiveShow): string {
    let text = searchTextCache.get(show)
    if (text === undefined) {
        text = normalizeSearchText(
            [
                show.city,
                show.country,
                show.venue,
                show.festival,
                show.tour,
                getArchiveShowYear(show)?.toString() ?? '',
                getArchiveShowDateDisplay(show),
                show.comment,
                ...show.songs,
            ].join('\n'),
        )
        searchTextCache.set(show, text)
    }

    return text
}

/**
 * Get unique sorted values.
 * @param values - Values to deduplicate.
 * @returns Unique sorted values.
 */
function uniqueSorted(values: Array<string>): Array<string> {
    return [...new Set(values)].sort()
}
