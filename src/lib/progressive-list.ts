'use client'

import { useDeferredValue, useSyncExternalStore } from 'react'

/** Entries rendered right away on a client-side navigation: enough to fill the first screen. */
const FIRST_CHUNK_SIZE = 12

/**
 * No-op subscription: whether the mount is a hydration never changes afterwards.
 * @returns Unsubscribe function.
 */
function subscribeToNothing(): () => void {
    return () => undefined
}

/**
 * Render a long list progressively when it mounts on a client-side navigation.
 * The first entries are committed at once, then the full list renders as a deferred, interruptible update,
 * so switching tabs no longer blocks on mounting every card. On the server and while hydrating, the full list
 * is returned straight away: the server markup already holds every entry, and it must match.
 * @param items - Entries to display.
 * @returns The entries to render now.
 */
export function useProgressiveList<T>(items: Array<T>): Array<T> {
    // False on the server and while hydrating, true when mounting after a client-side navigation.
    const isClientMount = useSyncExternalStore(
        subscribeToNothing,
        () => true,
        () => false,
    )

    return useDeferredValue(items, isClientMount ? items.slice(0, FIRST_CHUNK_SIZE) : items)
}
