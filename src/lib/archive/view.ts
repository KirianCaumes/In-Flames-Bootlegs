import { getArchiveShowYear, type ArchiveShow } from 'lib/archive/shows'

/** Display mode for the archive list. */
export type ArchiveView = 'grid' | 'timeline'

/** Default archive view. */
export const DEFAULT_ARCHIVE_VIEW: ArchiveView = 'grid'

/**
 * Parse the archive view from URL search parameters.
 * @returns Archive view.
 */
export function parseArchiveView(params: {
    /**
     * Read one parameter value.
     * @param key - Parameter name.
     * @returns Parameter value, or null when absent.
     */
    readonly get: (key: string) => string | null
}): ArchiveView {
    return params.get('view') === 'timeline' ? 'timeline' : DEFAULT_ARCHIVE_VIEW
}

/**
 * Group shows by year for the timeline view, preserving the incoming order within each group.
 * @param shows - Shows to group (already filtered and sorted).
 * @returns Year groups, ordered to match the first appearance of each year in the input.
 */
export function groupShowsByYear(shows: Array<ArchiveShow>): Array<{
    /** Year label for the group, or 'Unknown' when the date is missing. */
    year: string
    /** Shows belonging to the year. */
    shows: Array<ArchiveShow>
}> {
    const groups = new Map<string, Array<ArchiveShow>>()

    shows.forEach(show => {
        const year = getArchiveShowYear(show)?.toString() ?? 'Unknown'
        const bucket = groups.get(year)
        if (bucket) {
            bucket.push(show)
        } else {
            groups.set(year, [show])
        }
    })

    return [...groups.entries()].map(([year, groupShows]) => ({ year, shows: groupShows }))
}
