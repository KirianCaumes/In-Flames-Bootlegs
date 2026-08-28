import { trackMediaClick, type MediaClickSource } from 'lib/analytics'
import type { ArchiveShow } from 'lib/archive/shows'

/** Source of a bootleg click. */
export type BootlegClickSource = MediaClickSource

/** Bootleg click tracking input. */
interface BootlegClickInput {
    /** Show whose media link was clicked. */
    readonly show: ArchiveShow
    /** Source of the click. */
    readonly source: BootlegClickSource
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
})

/**
 * Track a bootleg media click in archive language.
 * @param input - Bootleg click details.
 */
export function trackBootlegClick(input: BootlegClickInput): void {
    trackMediaClick({
        link: input.show.mediaLink,
        source: input.source,
        title: `${input.show.city} ${input.show.country} ${formatAnalyticsDate(input.show)}`,
    })
}

/**
 * Format the date segment used in analytics titles.
 * @param show - Show to format.
 * @returns Display date.
 */
function formatAnalyticsDate(show: ArchiveShow): string {
    return show.date ? dateFormatter.format(show.date) : '-'
}
