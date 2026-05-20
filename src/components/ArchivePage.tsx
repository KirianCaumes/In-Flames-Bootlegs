'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import type { Show } from '@/lib/shows'
import { flagUrl } from '@/lib/flags'
import { getYear, parseDate } from '@/lib/date'
import ShowCard from './ShowCard'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Sort order for show dates */
type SortOrder = 'date-asc' | 'date-desc'

/**
 * Filter state for the archive page.
 * Controls which shows are displayed based on user selections.
 */
interface Filters {
    year: string
    country: string
    city: string
    song: string
    proshot: boolean
    video: boolean
    full: boolean
    sort: SortOrder
}

const DEFAULT_FILTERS: Filters = {
    year: '',
    country: '',
    city: '',
    song: '',
    proshot: false,
    video: false,
    full: false,
    sort: 'date-asc',
}

const CHECKBOX_FILTERS: Array<{
    key: 'proshot' | 'video' | 'full'
    label: string
}> = [
    { key: 'proshot', label: 'Pro Shot' },
    { key: 'video', label: 'Has Video' },
    { key: 'full', label: 'Full Show' },
]

// ── Shared sub-components ─────────────────────────────────────────────────────

/**
 * Chevron down SVG icon used in select dropdowns.
 * Positioned absolutely within relative containers.
 */
function ChevronDown() {
    return (
        <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
            />
        </svg>
    )
}

/**
 * Props for the ClearableInput component.
 * Provides a text input with datalist autocomplete and optional clear button.
 */
interface ClearableInputProps {
    id: string
    label: string
    placeholder: string
    listId: string
    options: string[]
    value: string
    onChange: (value: string) => void
}

/**
 * Reusable text input component with autocomplete from a datalist and optional clear button.
 * @param props - Component props including id, label, placeholder, datalist options, and change handler
 * @returns JSX.Element
 */
function ClearableInput({ id, label, placeholder, listId, options, value, onChange }: ClearableInputProps) {
    return (
        <div className="flex flex-col gap-1">
            <label
                className="text-xs text-gray-500 font-medium"
                htmlFor={id}
            >
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type="text"
                    placeholder={placeholder}
                    list={listId}
                    autoComplete="off"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-600 rounded-xl px-3 py-2.5 text-sm pr-9 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
                {value ? (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        aria-label={`Clear ${label.toLowerCase()}`}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-500"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                ) : (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </span>
                )}
                <datalist id={listId}>
                    {options.map(o => (
                        <option
                            key={o}
                            value={o}
                        />
                    ))}
                </datalist>
            </div>
        </div>
    )
}

// ── ArchivePage ───────────────────────────────────────────────────────────────

/**
 * Main archive page component with filtering and sorting capabilities.
 * Displays all In Flames bootleg shows with interactive filters.
 * Uses deferred values for smooth UI during filtering.
 * @param shows - Array of all available shows to display and filter
 * @returns JSX.Element
 */
export default function ArchivePage({ shows }: { shows: Show[] }) {
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
    const deferredFilters = useDeferredValue(filters)
    const isStale = filters !== deferredFilters

    function patch<K extends keyof Filters>(key: K, value: Filters[K]) {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    // ── Filter options ──────────────────────────────────────────────────────
    const years = useMemo(() => [...new Set(shows.map(s => getYear(s.Date)).filter((y): y is string => y !== null))].sort(), [shows])
    const countries = useMemo(() => [...new Set(shows.map(s => s.Country.trim()).filter(Boolean))].sort(), [shows])
    const cities = useMemo(() => [...new Set(shows.map(s => s.City.trim()).filter(Boolean))].sort(), [shows])
    const allSongs = useMemo(() => {
        const seen = new Map<string, string>()
        shows
            .flatMap(s => s.Setlist.split('\n').map(l => l.trim()))
            .forEach(s => {
                const key = s.toLowerCase()
                if (!seen.has(key)) seen.set(key, s)
            })
        return [...seen.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    }, [shows])

    // ── Filtered & sorted results ───────────────────────────────────────────
    const filtered = useMemo(() => {
        const result = shows.filter(s => {
            if (deferredFilters.year && getYear(s.Date) !== deferredFilters.year) return false
            if (deferredFilters.country && s.Country.trim() !== deferredFilters.country) return false
            if (deferredFilters.city && !s.City.toLowerCase().includes(deferredFilters.city.toLowerCase())) return false
            if (deferredFilters.song && !s.Setlist.toLowerCase().includes(deferredFilters.song.toLowerCase())) return false
            if (deferredFilters.proshot && s.ProShot !== 'Yes') return false
            if (deferredFilters.video && s.Video !== 'Yes') return false
            if (deferredFilters.full && s.Full !== 'Yes') return false
            return true
        })
        result.sort((a, b) => {
            const da = parseDate(a.Date),
                db = parseDate(b.Date)
            return deferredFilters.sort === 'date-asc' ? da - db : db - da
        })
        return result
    }, [shows, deferredFilters])

    const countryFlagSrc = filters.country ? flagUrl(filters.country) : null

    return (
        <>
            {/* ── Header ─────────────────────────────────────────────────────────── */}
            <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img
                            src="/favicon.svg"
                            alt="Bootlegs Archive"
                            className="w-14 h-14 rounded-lg object-cover border border-gray-700 shrink-0"
                        />
                        <div className="w-px h-8 bg-gradient-to-b from-brand-500 to-brand-600 hidden sm:block" />
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-widest uppercase text-brand-500">In Flames</h1>
                            <p className="text-gray-500 text-xs sm:text-sm tracking-wide">Bootlegs &amp; Live Shows Archive</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-brand-500">{shows.length}</div>
                        <div className="text-xs text-gray-500">shows archived</div>
                    </div>
                </div>
            </header>

            {/* ── Main ───────────────────────────────────────────────────────────── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Filters */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Filters</h2>
                        <button
                            onClick={() => setFilters(DEFAULT_FILTERS)}
                            className="text-xs text-brand-500 hover:text-brand-400 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-brand-500/10"
                        >
                            Reset all
                        </button>
                    </div>

                    {/* Primary filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        {/* Year */}
                        <div className="flex flex-col gap-1">
                            <label
                                className="text-xs text-gray-500 font-medium"
                                htmlFor="filter-year"
                            >
                                Year
                            </label>
                            <div className="relative">
                                <select
                                    id="filter-year"
                                    value={filters.year}
                                    onChange={e => patch('year', e.target.value)}
                                    className="appearance-none w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                >
                                    <option value="">All years</option>
                                    {years.map(y => (
                                        <option
                                            key={y}
                                            value={y}
                                        >
                                            {y}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown />
                            </div>
                        </div>

                        {/* Country */}
                        <div className="flex flex-col gap-1">
                            <label
                                className="text-xs text-gray-500 font-medium"
                                htmlFor="filter-country"
                            >
                                Country
                            </label>
                            <div className="flex items-center gap-2">
                                {countryFlagSrc && (
                                    <img
                                        src={countryFlagSrc}
                                        alt={filters.country}
                                        className="w-5 h-3.5 rounded-sm object-cover shadow shrink-0 text-transparent"
                                    />
                                )}
                                <div className="relative flex-1">
                                    <select
                                        id="filter-country"
                                        value={filters.country}
                                        onChange={e => patch('country', e.target.value)}
                                        className="appearance-none w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                    >
                                        <option value="">All countries</option>
                                        {countries.map(c => (
                                            <option
                                                key={c}
                                                value={c}
                                            >
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown />
                                </div>
                            </div>
                        </div>

                        <ClearableInput
                            id="filter-city"
                            label="City"
                            placeholder="e.g. Gothenburg"
                            listId="city-list"
                            options={cities}
                            value={filters.city}
                            onChange={v => patch('city', v)}
                        />

                        <ClearableInput
                            id="filter-song"
                            label="Song in setlist"
                            placeholder="e.g. The Jester Race"
                            listId="song-list"
                            options={allSongs}
                            value={filters.song}
                            onChange={v => patch('song', v)}
                        />
                    </div>

                    {/* Secondary filters */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-gray-800/50">
                        {CHECKBOX_FILTERS.map(({ key, label }) => (
                            <label
                                key={key}
                                className="flex items-center gap-2 cursor-pointer group"
                            >
                                <input
                                    type="checkbox"
                                    checked={filters[key]}
                                    onChange={e => patch(key, e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-[#D50209] cursor-pointer"
                                />
                                <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
                            </label>
                        ))}

                        <div className="ml-auto flex items-center gap-2">
                            <label
                                className="text-xs text-gray-500"
                                htmlFor="sort-select"
                            >
                                Sort
                            </label>
                            <div className="relative">
                                <select
                                    id="sort-select"
                                    value={filters.sort}
                                    onChange={e => patch('sort', e.target.value as SortOrder)}
                                    className="appearance-none bg-gray-800 border border-gray-700 text-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                >
                                    <option value="date-asc">Date (oldest first)</option>
                                    <option value="date-desc">Date (newest first)</option>
                                </select>
                                <ChevronDown />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results bar */}
                <div className="flex items-center justify-between mb-4 min-h-[1.5rem]">
                    {filtered.length > 0 && (
                        <p className="text-sm text-gray-500">
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
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <p className="text-gray-500 font-medium">No shows match your filters</p>
                        <button
                            onClick={() => setFilters(DEFAULT_FILTERS)}
                            className="text-sm text-brand-500 hover:text-brand-400 underline underline-offset-2 transition-colors"
                        >
                            Reset filters
                        </button>
                    </div>
                )}

                {/* Grid */}
                {filtered.length > 0 && (
                    <div
                        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-150 ${isStale ? 'opacity-50' : 'opacity-100'}`}
                    >
                        {filtered.map((show, i) => (
                            <ShowCard
                                key={`${show.Date}-${show.City}-${i}`}
                                show={show}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* ── Footer ─────────────────────────────────────────────────────────── */}
            <footer className="border-t border-gray-800/50 mt-12 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-5">
                    <div className="flex flex-wrap justify-center gap-3">
                        <a
                            href={`mailto:jesterscollection@gmail.com?subject=${encodeURIComponent('Dead link — In Flames Archive')}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-500 border border-gray-800 hover:border-brand-500/40 hover:text-brand-500 transition-colors"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                            </svg>
                            Signal a dead link
                        </a>
                        <a
                            href={`mailto:jesterscollection@gmail.com?subject=${encodeURIComponent('New show suggestion — In Flames Archive')}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-500 border border-gray-800 hover:border-brand-500/40 hover:text-brand-500 transition-colors"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Suggest a new show
                        </a>
                    </div>
                    <p className="text-gray-700 text-xs">In Flames Bootlegs Archive &mdash; Community recordings</p>
                    <p className="text-gray-700 text-xs max-w-xl text-center">
                        This is a non-commercial fan archive. All recordings, artwork and trademarks belong to their respective owners. In
                        Flames is a trademark. This site is not affiliated with or endorsed by In Flames.
                    </p>
                    <p className="text-gray-700 text-xs">Generated with AI assistance</p>
                </div>
            </footer>
        </>
    )
}
