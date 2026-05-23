declare global {
    interface Window {
        /** Google Analytics gtag function */
        gtag?: (...args: Array<unknown>) => void
        /** Google Analytics dataLayer array */
        dataLayer?: Array<unknown>
    }
}

/**
 * Fire a Google Analytics custom event. No-ops when gtag is not loaded (consent refused or missing GA ID).
 * @param eventName - The name of the event to track
 * @param params - Optional parameters to include with the event, such as category, label, or value
 */
export function trackEvent(eventName: string, params?: Record<string, string | number | boolean>) {
    window.gtag?.('event', eventName, params)
}
