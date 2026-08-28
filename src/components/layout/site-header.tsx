'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
// eslint-disable-next-line no-restricted-imports
import IconSvg from '../../../public/favicon.svg'

// ── SiteHeader ────────────────────────────────────────────────────────────────

/** How many entries each section holds, shown next to its tab. */
interface SectionCounts {
    /** Entries in the live shows archive. */
    readonly shows: number
    /** Entries in the miscellaneous performances section. */
    readonly performances: number
}

/** Sections reachable from the header. Keep in sync with the app routes. */
const TABS: Array<{
    /** Route the tab points to. */
    href: string
    /** Tab label. */
    label: string
    /** Which count to show next to the label, and in the header counter when the tab is active. */
    countKey: keyof SectionCounts
    /** What the header counter counts on this section. */
    countLabel: string
}> = [
    { href: '/', label: 'Live shows', countKey: 'shows', countLabel: 'shows archived' },
    { href: '/miscellaneous', label: 'Miscellaneous', countKey: 'performances', countLabel: 'performances' },
]

/**
 * Site chrome shared by every page: a sticky bar with the logo, wordmark and the current section's count,
 * followed by the section tabs.
 * The tabs scroll away with the page rather than staying pinned, and carry their own counts, so both section
 * sizes are visible at once. They are deliberately not the segmented control used by the grid/timeline toggle:
 * that idiom switches a view, while these navigate between pages.
 * The bar's height is mirrored by `--spacing-header` in globals.css, which offsets the sticky year headers of the timeline view.
 * @returns JSX.Element
 */
export default function SiteHeader({
    counts,
}: {
    /** Number of entries in each section. */
    readonly counts: SectionCounts
}) {
    const pathname = usePathname()
    const activeTab = TABS.find(tab => tab.href === pathname)
    const isHome = pathname === '/'
    // The wordmark is the page's <h1> on the archive home only; other pages carry their own heading in <main>.
    const Wordmark = isHome ? 'h1' : 'p'

    return (
        <>
            <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            aria-label="Scroll to top"
                            className="cursor-pointer"
                            onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            type="button"
                        >
                            <Image
                                alt=""
                                className="w-14 h-14 object-cover shrink-0"
                                src={IconSvg as string}
                            />
                        </button>
                        <div className="w-px h-8 bg-gradient-to-b from-brand-500 to-brand-600 hidden sm:block" />
                        <div>
                            <Wordmark className="leading-tight">
                                <span className="block text-xl sm:text-2xl font-display font-bold tracking-wide uppercase text-brand-500">
                                    In Flames
                                </span>
                                <span className="block text-gray-400 text-xs sm:text-sm tracking-wide font-normal">
                                    Bootlegs &amp; Live Shows Archive
                                </span>
                            </Wordmark>
                        </div>
                    </div>
                    {activeTab && (
                        <div className="text-right shrink-0">
                            <div className="text-2xl font-display font-bold text-brand-500 tabular-nums">{counts[activeTab.countKey]}</div>
                            <div className="text-xs text-gray-400">{activeTab.countLabel}</div>
                        </div>
                    )}
                </div>
            </header>

            <div className="border-b border-gray-800">
                <nav
                    aria-label="Archive sections"
                    className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6"
                >
                    {TABS.map(({ href, label, countKey }) => {
                        const isActive = pathname === href
                        return (
                            <Link
                                aria-current={isActive ? 'page' : undefined}
                                // The negative margin lays the tab's own border over the strip's, so the active underline sits on it.
                                // eslint-disable-next-line max-len
                                className={`-mb-px flex items-baseline gap-2 border-b-2 py-3 text-sm font-medium transition-colors ${isActive ? 'border-brand-500 text-gray-100' : 'border-transparent text-gray-400 hover:border-gray-700 hover:text-gray-200'}`}
                                href={href}
                                key={href}
                            >
                                {label}
                                <span className="font-mono text-xs tabular-nums text-gray-500">{counts[countKey]}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </>
    )
}
