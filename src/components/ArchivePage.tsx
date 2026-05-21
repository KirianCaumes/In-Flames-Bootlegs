'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import Image from 'next/image'
import ShowCard from 'components/ShowCard'
import ArchiveFilters, { type Filters, DEFAULT_FILTERS } from 'components/ArchiveFilters'
import { getYear, parseDate } from 'lib/date'
// eslint-disable-next-line no-restricted-imports
import IconSvg from '../../public/favicon.svg'
import type { Show } from 'lib/shows'

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
    readonly shows: Array<Show>
}) {
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
    const deferredFilters = useDeferredValue(filters)
    const isStale = filters !== deferredFilters
    const filtered = useMemo(() => {
        const result = shows.filter(s => {
            if (deferredFilters.year && getYear(s.Date) !== deferredFilters.year) {
                return false
            }
            if (deferredFilters.country && s.Country.trim() !== deferredFilters.country) {
                return false
            }
            if (deferredFilters.city && !s.City.toLowerCase().includes(deferredFilters.city.toLowerCase())) {
                return false
            }
            if (deferredFilters.song && !s.Setlist.toLowerCase().includes(deferredFilters.song.toLowerCase())) {
                return false
            }
            if (deferredFilters.proshot && s.ProShot !== 'Yes') {
                return false
            }
            if (deferredFilters.video && s.Video !== 'Yes') {
                return false
            }
            if (deferredFilters.full && s.Full !== 'Yes') {
                return false
            }
            return true
        })
        result.sort((a, b) => {
            const da = parseDate(a.Date),
                db = parseDate(b.Date)
            return deferredFilters.sort === 'date-asc' ? da - db : db - da
        })
        return result
    }, [shows, deferredFilters])

    return (
        <>
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Image
                            alt="Bootlegs Archive"
                            className="w-14 h-14 object-cover shrink-0"
                            loading="eager"
                            src={IconSvg as string}
                        />
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
                    filters={filters}
                    onFiltersChange={setFilters}
                    shows={shows}
                />

                {/* Results bar */}
                <div className="flex items-center justify-between mb-4 min-h-[1.5rem]">
                    {filtered.length > 0 && (
                        <p className="text-sm text-gray-400">
                            {filtered.length === shows.length ? `${shows.length} shows` : `${filtered.length} of ${shows.length} shows`}
                        </p>
                    )}
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
                            className="text-sm text-brand-500 hover:text-brand-400 underline underline-offset-2 transition-colors"
                            onClick={() => {
                                setFilters(DEFAULT_FILTERS)
                            }}
                            type="button"
                        >
                            Reset filters
                        </button>
                    </div>
                )}

                {/* Grid */}
                {filtered.length > 0 && (
                    <div
                        // eslint-disable-next-line max-len
                        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-150 ${isStale ? 'opacity-50' : 'opacity-100'}`}
                    >
                        {filtered.map((show, i) => (
                            <ShowCard
                                // eslint-disable-next-line react/no-array-index-key
                                key={`${show.Date}-${show.City}-${i}`}
                                show={show}
                            />
                        ))}
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
                    <p className="text-gray-500 text-xs">
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
