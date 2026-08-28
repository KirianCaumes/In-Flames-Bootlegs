/** Source of a media click inside a card. */
export type MediaClickSource = 'thumbnail' | 'footer'

/** Media click tracking input. */
interface MediaClickInput {
    /** Link that was clicked. */
    readonly link: string
    /** Human-readable label identifying what was clicked. */
    readonly title: string
    /** Part of the card the click came from. */
    readonly source: MediaClickSource
}

declare global {
    interface Window {
        /** Google Analytics gtag function. */
        gtag?: (...args: Array<unknown>) => void
        /** Google Analytics dataLayer array. */
        dataLayer?: Array<unknown>
    }
}

/**
 * Track a click on an archived media link.
 * The `bootleg_click` event name is shared by every kind of entry to keep the Google Analytics history continuous.
 * @param input - Media click details.
 */
export function trackMediaClick(input: MediaClickInput): void {
    trackEvent('bootleg_click', {
        link_url: input.link,
        source: input.source,
        title: input.title,
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
