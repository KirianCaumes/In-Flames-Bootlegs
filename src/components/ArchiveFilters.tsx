'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { flagUrl } from 'lib/flags'
import { getYear } from 'lib/date'
import type { Show } from 'lib/shows'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Sort order for show dates */
export type SortOrder = 'date-asc' | 'date-desc'

/**
 * Filter state for the archive page.
 * Controls which shows are displayed based on user selections.
 */
export interface Filters {
    /** Year filter */
    year: string
    /** Country filter */
    country: string
    /** City filter */
    city: string
    /** Song filter */
    song: string
    /** Pro shot filter */
    proshot: boolean
    /** Video filter */
    video: boolean
    /** Full show filter */
    full: boolean
    /** Sort order filter */
    sort: SortOrder
}

// eslint-disable-next-line react-refresh/only-export-components
export const DEFAULT_FILTERS: Filters = {
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
    /** Key for the filter */
    key: 'proshot' | 'video' | 'full'
    /** Label for the filter */
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
 * @returns SVG element representing a downward pointing chevron.
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
                d="M19 9l-7 7-7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
            />
        </svg>
    )
}

/**
 * Props for the ClearableInput component.
 */
interface ClearableInputProps {
    /** Unique identifier for the input element */
    readonly id: string
    /** Label text for the input element */
    readonly label: string
    /** Placeholder text for the input element */
    readonly placeholder: string
    /** Identifier for the datalist element */
    readonly listId: string
    /** Options for the datalist element */
    readonly options: Array<string>
    /** Current value of the input element */
    readonly value: string
    /** Change handler for the input element */
    readonly onChange: (value: string) => void
}

/**
 * Reusable text input with autocomplete datalist and optional clear button.
 * @returns Clearable input element with label and datalist options.
 */
function ClearableInput({ id, label, placeholder, listId, options, value, onChange }: ClearableInputProps) {
    return (
        <div className="flex flex-col gap-1">
            <label
                className="text-xs text-gray-400 font-medium"
                htmlFor={id}
            >
                {label}
            </label>
            <div className="relative">
                <input
                    autoComplete="off"
                    // eslint-disable-next-line max-len
                    className="w-full bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-600 rounded-xl px-3 py-2.5 text-sm pr-9 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all [&::-webkit-calendar-picker-indicator]:!hidden"
                    id={id}
                    list={listId}
                    onChange={e => {
                        onChange(e.target.value)
                    }}
                    placeholder={placeholder}
                    type="text"
                    value={value}
                />
                {value ? (
                    <button
                        aria-label={`Clear ${label.toLowerCase()}`}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-500"
                        onClick={() => {
                            onChange('')
                        }}
                        type="button"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M6 18L18 6M6 6l12 12"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                            />
                        </svg>
                    </button>
                ) : (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
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

// ── ArchiveFilters ────────────────────────────────────────────────────────────

interface ArchiveFiltersProps {
    /** Shows to display and filter */
    readonly shows: Array<Show>
    /** Current filter values */
    readonly filters: Filters
    /** Callback when filters change */
    readonly onFiltersChange: (filters: Filters) => void
}

/**
 * Filter panel for the archive page.
 * Renders year/country/city/song selectors, checkbox toggles, and sort order.
 * @returns Filter UI for refining the list of shows displayed in the archive.
 */
export default function ArchiveFilters({ shows, filters, onFiltersChange }: ArchiveFiltersProps) {
    const [areFiltersOpen, setAreFiltersOpen] = useState(false)

    // Open filters by default on desktop
    useEffect(() => {
        const handleResize = () => {
            const isDesktop = window.matchMedia('(min-width: 640px)').matches
            if (isDesktop && !areFiltersOpen) {
                setAreFiltersOpen(true)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [areFiltersOpen])

    const years = useMemo(() => [...new Set(shows.map(s => getYear(s.Date)).filter((y): y is string => y !== null))].sort(), [shows])
    const countries = useMemo(() => [...new Set(shows.map(s => s.Country.trim()).filter(Boolean))].sort(), [shows])
    const cities = useMemo(() => [...new Set(shows.map(s => s.City.trim()).filter(Boolean))].sort(), [shows])
    const allSongs = useMemo(() => {
        const seen = new Map<string, string>()
        shows
            .flatMap(s =>
                s.Setlist.split('\n')
                    .map(l => l.trim())
                    .filter(Boolean),
            )
            .forEach(s => {
                const key = s.toLowerCase()
                if (!seen.has(key)) {
                    seen.set(key, s)
                }
            })
        return [...seen.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    }, [shows])

    /**
     * Helper function to update a single filter value while keeping the rest unchanged.
     * @param key - The filter key to update
     * @param value - The new value for the specified filter key
     */
    function patch<K extends keyof Filters>(key: K, value: Filters[K]) {
        onFiltersChange({ ...filters, [key]: value })
    }

    const countryFlagSrc = filters.country ? flagUrl(filters.country) : null

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 mb-6">
            <div className={`flex items-center justify-between ${areFiltersOpen ? 'mb-4' : 'sm:mb-4'}`}>
                <button
                    className="sm:hidden flex items-center gap-1.5"
                    onClick={() => {
                        setAreFiltersOpen(prev => !prev)
                    }}
                    type="button"
                >
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Filters</span>
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${areFiltersOpen ? 'rotate-180' : ''}`}
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
                </button>
                <h2 className="hidden sm:block text-xs font-semibold text-gray-400 uppercase tracking-widest">Filters</h2>
                <button
                    className="text-xs text-brand-500 hover:text-brand-400 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-brand-500/10"
                    onClick={() => {
                        onFiltersChange(DEFAULT_FILTERS)
                    }}
                    type="button"
                >
                    Reset all
                </button>
            </div>

            <div
                className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                style={{ gridTemplateRows: areFiltersOpen ? '1fr' : '0fr' }}
            >
                <div className="overflow-hidden">
                    {/* Primary filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        {/* Year */}
                        <div className="flex flex-col gap-1">
                            <label
                                className="text-xs text-gray-400 font-medium"
                                htmlFor="filter-year"
                            >
                                Year
                            </label>
                            <div className="relative">
                                <select
                                    // eslint-disable-next-line max-len
                                    className="appearance-none w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                    id="filter-year"
                                    onChange={e => {
                                        patch('year', e.target.value)
                                    }}
                                    value={filters.year}
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
                                className="text-xs text-gray-400 font-medium"
                                htmlFor="filter-country"
                            >
                                Country
                            </label>
                            <div className="flex items-center gap-2">
                                {countryFlagSrc && (
                                    <Image
                                        alt={filters.country}
                                        className="w-5 h-3.5 rounded-sm object-cover shadow shrink-0 text-transparent"
                                        height={14}
                                        src={countryFlagSrc}
                                        width={20}
                                    />
                                )}
                                <div className="relative flex-1">
                                    <select
                                        // eslint-disable-next-line max-len
                                        className="appearance-none w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                        id="filter-country"
                                        onChange={e => {
                                            patch('country', e.target.value)
                                        }}
                                        value={filters.country}
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
                            listId="city-list"
                            onChange={v => {
                                patch('city', v)
                            }}
                            options={cities}
                            placeholder="e.g. Gothenburg"
                            value={filters.city}
                        />

                        <ClearableInput
                            id="filter-song"
                            label="Song in setlist"
                            listId="song-list"
                            onChange={v => {
                                patch('song', v)
                            }}
                            options={allSongs}
                            placeholder="e.g. The Jester Race"
                            value={filters.song}
                        />
                    </div>

                    {/* Secondary filters */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-gray-800/50">
                        {CHECKBOX_FILTERS.map(({ key, label }) => (
                            <label
                                className="flex items-center gap-2 cursor-pointer group"
                                key={key}
                            >
                                <input
                                    checked={filters[key]}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-[#D50209] cursor-pointer"
                                    onChange={e => {
                                        patch(key, e.target.checked)
                                    }}
                                    type="checkbox"
                                />
                                <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
                            </label>
                        ))}

                        <div className="ml-auto flex items-center gap-2">
                            <label
                                className="text-xs text-gray-400"
                                htmlFor="sort-select"
                            >
                                Sort
                            </label>
                            <div className="relative">
                                <select
                                    // eslint-disable-next-line max-len
                                    className="appearance-none bg-gray-800 border border-gray-700 text-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                                    id="sort-select"
                                    onChange={e => {
                                        patch('sort', e.target.value as SortOrder)
                                    }}
                                    value={filters.sort}
                                >
                                    <option value="date-asc">Date (oldest first)</option>
                                    <option value="date-desc">Date (newest first)</option>
                                </select>
                                <ChevronDown />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
