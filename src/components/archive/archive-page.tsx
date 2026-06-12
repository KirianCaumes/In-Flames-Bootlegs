'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ArchiveFilters from 'components/archive/archive-filters'
import ShowCard from 'components/archive/show-card'
import ShowTimeline from 'components/archive/show-timeline'
import ViewToggle from 'components/archive/view-toggle'
import { applyArchiveQuery, DEFAULT_ARCHIVE_QUERY, parseArchiveQuery, serializeArchiveQuery, type ArchiveQuery } from 'lib/archive/query'
import { DEFAULT_ARCHIVE_VIEW, parseArchiveView, type ArchiveView } from 'lib/archive/view'
// eslint-disable-next-line no-restricted-imports
import IconSvg from '../../../public/favicon.svg'
import type { ArchiveShow } from 'lib/archive/shows'

// ── ArchivePage ───────────────────────────────────────────────────────────────

/**
 * Main archive page component with filtering and sorting capabilities.
 * Displays all In Flames bootleg shows with interactive filters.
 * Uses deferred values for smooth UI during filtering.
 * @returns JSX.Element
 */
export default function ArchivePage({
    shows,
    device,
}: {
    /** Shows to display and filter */
    readonly shows: Array<ArchiveShow>
    /** Detected device type for responsive behavior */
    readonly device: 'mobile' | 'desktop'
}) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const [query, setQuery] = useState<ArchiveQuery>(() => parseArchiveQuery(searchParams))
    const [view, setView] = useState<ArchiveView>(() => parseArchiveView(searchParams))
    const deferredQuery = useDeferredValue(query)
    const deferredView = useDeferredValue(view)
    const isStale = query !== deferredQuery || view !== deferredView

    /**
     * Syncs the current query and view to the URL.
     * @param nextQuery - Filter values to serialize.
     * @param nextView - View to serialize.
     */
    function syncUrl(nextQuery: ArchiveQuery, nextView: ArchiveView) {
        const params = new URLSearchParams(serializeArchiveQuery(nextQuery))
        if (nextView !== DEFAULT_ARCHIVE_VIEW) {
            params.set('view', nextView)
        }
        const qs = params.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }

    /**
     * Updates filters state and syncs the new filter values to the URL.
     * @param next - New filter values to apply
     */
    function handleQueryChange(next: ArchiveQuery) {
        setQuery(next)
        syncUrl(next, view)
    }

    /**
     * Updates the display view and syncs it to the URL.
     * @param next - New view to apply.
     */
    function handleViewChange(next: ArchiveView) {
        setView(next)
        syncUrl(query, next)
    }

    const filtered = useMemo(() => applyArchiveQuery(shows, deferredQuery), [shows, deferredQuery])
    const resultsLabel = filtered.length === shows.length ? `${shows.length} shows` : `${filtered.length} of ${shows.length} shows`

    return (
        <>
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            className="cursor-pointer"
                            onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            type="button"
                        >
                            <Image
                                alt="Bootlegs Archive"
                                className="w-14 h-14 object-cover shrink-0"
                                loading="eager"
                                src={IconSvg as string}
                            />
                        </button>
                        <div className="w-px h-8 bg-gradient-to-b from-brand-500 to-brand-600 hidden sm:block" />
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-widest uppercase text-brand-500">In Flames</h1>
                            <p className="text-gray-400 text-xs sm:text-sm tracking-wide">Bootlegs &amp; Live Shows Archive</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-brand-500">{shows.length}</div>
                        <div className="text-xs text-gray-400">shows archived</div>
                    </div>
                </div>
            </header>

            {/* ── Main ───────────────────────────────────────────────────────────── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Filters */}
                <ArchiveFilters
                    defaultOpen={device === 'desktop'}
                    onQueryChange={handleQueryChange}
                    query={query}
                    shows={shows}
                />

                {/* Results bar */}
                <div className="flex items-center justify-between gap-4 mb-4 min-h-[2rem]">
                    <p className="text-sm text-gray-400">{filtered.length > 0 ? resultsLabel : ''}</p>
                    <ViewToggle
                        onViewChange={handleViewChange}
                        view={view}
                    />
                </div>

                {/* Empty state */}
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                        <svg
                            className="w-12 h-12 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                            />
                        </svg>
                        <p className="text-gray-400 font-medium">No shows match your filters</p>
                        <button
                            className="text-sm text-brand-500 hover:text-brand-400 underline underline-offset-2 transition-colors cursor-pointer"
                            onClick={() => {
                                handleQueryChange(DEFAULT_ARCHIVE_QUERY)
                            }}
                            type="button"
                        >
                            Reset filters
                        </button>
                    </div>
                )}

                {/* Results */}
                {filtered.length > 0 && (
                    <div className={`transition-opacity duration-150 ${isStale ? 'opacity-50' : 'opacity-100'}`}>
                        {
                            {
                                timeline: <ShowTimeline shows={filtered} />,
                                grid: (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {filtered.map((show, i) => (
                                            <ShowCard
                                                imageLoading={i < 4 ? 'eager' : 'lazy'}
                                                // eslint-disable-next-line react/no-array-index-key
                                                key={`${show.id}-${i}`}
                                                show={show}
                                            />
                                        ))}
                                    </div>
                                ),
                            }[deferredView]
                        }
                    </div>
                )}
            </main>

            {/* ── Footer ─────────────────────────────────────────────────────────── */}
            <footer className="border-t border-gray-800/50 mt-12 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-4">
                    <div className="flex flex-wrap justify-center gap-3">
                        <a
                            // eslint-disable-next-line max-len
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 border border-gray-800 hover:border-brand-500/40 hover:text-brand-500 transition-colors"
                            href={`mailto:ajesterscollection@gmail.com?subject=${encodeURIComponent('Dead link — In Flames Archive')}`}
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    // eslint-disable-next-line max-len
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                />
                            </svg>
                            Signal a dead link
                        </a>
                        <a
                            // eslint-disable-next-line max-len
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 border border-gray-800 hover:border-brand-500/40 hover:text-brand-500 transition-colors"
                            href={`mailto:ajesterscollection@gmail.com?subject=${encodeURIComponent('New show suggestion — In Flames Archive')}`}
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M12 4v16m8-8H4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                />
                            </svg>
                            Suggest a new show
                        </a>
                    </div>
                    <p className="text-gray-400 text-xs">
                        Non-commercial fan archive. All recordings and trademarks belong to their respective owners.
                    </p>
                    <a
                        className="text-xs text-brand-400 hover:text-brand-400 transition-colors"
                        href="https://jesterscollection.kiriancaumes.fr"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        jesterscollection.kiriancaumes.fr
                    </a>
                </div>
            </footer>
        </>
    )
}
