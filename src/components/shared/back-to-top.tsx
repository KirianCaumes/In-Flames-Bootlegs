'use client'

import { useSyncExternalStore } from 'react'

/** Scroll distance past which the button shows, roughly one screen. */
const SHOW_AFTER_PX = 800

/**
 * Subscribe to window scrolling.
 * @param onChange - Called on scroll.
 * @returns Unsubscribe function.
 */
function subscribeToScroll(onChange: () => void): () => void {
    window.addEventListener('scroll', onChange, { passive: true })
    return () => {
        window.removeEventListener('scroll', onChange)
    }
}

/**
 * Floating button bringing the page back to the top, shown once the user has scrolled a screen down.
 * The snapshot is a boolean, so scrolling only re-renders when the button appears or hides.
 * @returns JSX.Element
 */
export default function BackToTop() {
    const isVisible = useSyncExternalStore(
        subscribeToScroll,
        () => window.scrollY > SHOW_AFTER_PX,
        () => false,
    )

    return (
        <button
            aria-hidden={!isVisible}
            aria-label="Back to top"
            // eslint-disable-next-line max-len
            className={`fixed bottom-6 right-4 sm:right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-gray-900/90 text-gray-300 shadow-xl backdrop-blur-sm transition-all duration-200 hover:border-brand-500 hover:text-brand-500 focus-visible:outline-2 focus-visible:outline-brand-500 cursor-pointer ${isVisible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'}`}
            onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            tabIndex={isVisible ? 0 : -1}
            type="button"
        >
            <svg
                aria-hidden="true"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    d="M5 15l7-7 7 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                />
            </svg>
        </button>
    )
}
