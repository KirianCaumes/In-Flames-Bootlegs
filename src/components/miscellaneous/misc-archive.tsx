'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import PerformanceCard from 'components/miscellaneous/performance-card'
import PageHero, { type HeroStat } from 'components/shared/page-hero'
import SearchInput from 'components/shared/search-input'
import { getMiscPerformanceYear, type MiscPerformance } from 'lib/miscellaneous/performances'
import { applyMiscQuery, DEFAULT_MISC_QUERY, parseMiscQuery, serializeMiscQuery, type MiscQuery } from 'lib/miscellaneous/query'
import { MISCELLANEOUS_DESCRIPTION } from 'lib/seo/graph'
import type { ArchiveSortOrder } from 'lib/archive/query'

/**
 * Build the figures shown in the hero.
 * @param performances - Every performance of the section.
 * @returns Hero figures.
 */
function buildHeroStats(performances: Array<MiscPerformance>): Array<HeroStat> {
    const years = performances.map(performance => getMiscPerformanceYear(performance)).filter(year => year !== null)
    const events = new Set(performances.map(performance => performance.event.trim()).filter(Boolean))

    return [
        ...(years.length > 0 ? [{ label: 'Years', value: `${Math.min(...years)}–${Math.max(...years)}` }] : []),
        { label: 'Events', value: events.size.toString() },
        { label: 'Pro shots', value: performances.filter(performance => performance.availability.hasProShot).length.toString() },
    ]
}

/**
 * Miscellaneous performances list: hero, search and sort, then the grid.
 * Mirrors the archive page's behavior (URL-synced query) with a lighter query.
 * @returns JSX.Element
 */
export default function MiscArchive({
    performances,
}: {
    /** Every performance, oldest first. */
    readonly performances: Array<MiscPerformance>
}) {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const [query, setQuery] = useState<MiscQuery>(() => parseMiscQuery(searchParams))
    const deferredQuery = useDeferredValue(query)
    const isStale = query !== deferredQuery

    const filtered = useMemo(() => applyMiscQuery(performances, deferredQuery), [performances, deferredQuery])
    const heroStats = useMemo(() => buildHeroStats(performances), [performances])
    const resultsLabel =
        filtered.length === performances.length
            ? `${performances.length} performances`
            : `${filtered.length} of ${performances.length} performances`

    /**
     * Updates the query and syncs it to the URL.
     * @param next - New query.
     */
    function handleQueryChange(next: MiscQuery) {
        setQuery(next)
        const qs = serializeMiscQuery(next)
        window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname)
    }

    return (
        <main
            className="max-w-7xl mx-auto px-4 sm:px-6 py-6"
            id="main-content"
            tabIndex={-1}
        >
            <PageHero
                description={MISCELLANEOUS_DESCRIPTION}
                stats={heroStats}
                title="Miscellaneous performances"
            />

            <h2 className="sr-only">Browse the miscellaneous performances</h2>

            {/* Search and sort */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="flex-1">
                    <SearchInput
                        id="misc-search"
                        label="Search performances"
                        onChange={q => {
                            handleQueryChange({ ...query, q })
                        }}
                        placeholder="Search an event, song, year... e.g. acoustic"
                        value={query.q}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label
                        className="text-xs text-gray-400"
                        htmlFor="misc-sort"
                    >
                        Sort
                    </label>
                    <div className="relative">
                        <select
                            // eslint-disable-next-line max-len
                            className="appearance-none bg-gray-800 border border-gray-700 text-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                            id="misc-sort"
                            onChange={e => {
                                handleQueryChange({ ...query, sort: e.target.value as ArchiveSortOrder })
                            }}
                            value={query.sort}
                        >
                            <option value="date-asc">Date (oldest first)</option>
                            <option value="date-desc">Date (newest first)</option>
                        </select>
                        <svg
                            aria-hidden="true"
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M19 9l-7 7-7-7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Results bar */}
            <p
                aria-live="polite"
                className="text-sm text-gray-400 mb-4"
                role="status"
            >
                {filtered.length > 0 ? resultsLabel : 'No matching performances'}
            </p>

            {/* Empty state */}
            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                    <svg
                        aria-hidden="true"
                        className="w-12 h-12 text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            // eslint-disable-next-line max-len
                            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                        />
                    </svg>
                    <p className="text-gray-400 font-medium">
                        {performances.length === 0 ? 'No performance listed yet' : 'No performance matches your search'}
                    </p>
                    {query.q && (
                        <button
                            className="text-sm text-brand-500 hover:text-brand-400 underline underline-offset-2 transition-colors cursor-pointer"
                            onClick={() => {
                                handleQueryChange({ ...query, q: DEFAULT_MISC_QUERY.q })
                            }}
                            type="button"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            )}

            {/* Results */}
            {filtered.length > 0 && (
                <div className={`transition-opacity duration-150 ${isStale ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((performance, i) => (
                            <PerformanceCard
                                key={performance.id}
                                performance={performance}
                                priority={i === 0}
                            />
                        ))}
                    </div>
                </div>
            )}
        </main>
    )
}
