import type { ArchiveShow } from 'lib/archive/shows'

/** Source of a bootleg click. */
export type BootlegClickSource = 'thumbnail' | 'footer'

/** Bootleg click tracking input. */
interface BootlegClickInput {
    /** Show whose media link was clicked. */
    readonly show: ArchiveShow
    /** Source of the click. */
    readonly source: BootlegClickSource
}

declare global {
    interface Window {
        /** Google Analytics gtag function. */
        gtag?: (...args: Array<unknown>) => void
        /** Google Analytics dataLayer array. */
        dataLayer?: Array<unknown>
    }
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
    trackEvent('bootleg_click', {
        link_url: input.show.mediaLink,
        source: input.source,
        title: `${input.show.city} ${input.show.country} ${formatAnalyticsDate(input.show)}`,
    })
}

/**
 * Fire a Google Analytics custom event. No-ops when gtag is not loaded.
 * @param eventName - Event name.
 * @param params - Event parameters.
 */
export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>): void {
    window.gtag?.('event', eventName, params)
}

/**
 * Format the date segment used in analytics titles.
 * @param show - Show to format.
 * @returns Display date.
 */
function formatAnalyticsDate(show: ArchiveShow): string {
    return show.date ? dateFormatter.format(show.date) : '-'
}
