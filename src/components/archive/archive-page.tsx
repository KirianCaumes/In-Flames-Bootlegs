'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import ArchiveFilters from 'components/archive/archive-filters'
import ShowCard from 'components/archive/show-card'
import ShowTimeline from 'components/archive/show-timeline'
import ViewToggle from 'components/archive/view-toggle'
import { applyArchiveQuery, DEFAULT_ARCHIVE_QUERY, parseArchiveQuery, serializeArchiveQuery, type ArchiveQuery } from 'lib/archive/query'
import { DEFAULT_ARCHIVE_VIEW, parseArchiveView, type ArchiveView } from 'lib/archive/view'
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
}: {
    /** Shows to display and filter */
    readonly shows: Array<ArchiveShow>
}) {
    const searchParams = useSearchParams()
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
        window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
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
        <main
            className="max-w-7xl mx-auto px-4 sm:px-6 py-6"
            id="main-content"
            tabIndex={-1}
        >
            <h2 className="sr-only">Browse the In Flames live show &amp; bootleg archive</h2>
            {/* Filters */}
            <ArchiveFilters
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
                                            key={show.id}
                                            priority={i === 0}
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
    )
}
