'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { flagUrl } from 'lib/archive/flags'
import { buildArchiveFacets, DEFAULT_ARCHIVE_QUERY, isArchiveQueryActive, patchArchiveQuery } from 'lib/archive/query'
import type { ArchiveShow } from 'lib/archive/shows'
import type { ArchiveQuery, ArchiveSortOrder } from 'lib/archive/query'

// ── Types ─────────────────────────────────────────────────────────────────────

export type Filters = ArchiveQuery
export type SortOrder = ArchiveSortOrder
export const DEFAULT_FILTERS = DEFAULT_ARCHIVE_QUERY

const CHECKBOX_FILTERS: Array<{
    /** Key for the filter */
    key: 'proshot' | 'video' | 'full'
    /** Label for the filter */
    label: string
    /** Description for the filter */
    tooltip?: string
}> = [
    {
        key: 'proshot',
        label: 'Pro Shot',
        tooltip:
            // eslint-disable-next-line max-len
            'Shows with professionally recorded video and/or audio footage available.\nNote: for some old shows it is difficult to classify the quality of the footage as pro shot or amateur.',
    },
    { key: 'video', label: 'Has Video', tooltip: 'Shows with any kind of video footage available, including amateur recordings.' },
    { key: 'full', label: 'Full Show', tooltip: 'Shows with a complete setlist recorded.' },
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
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-500 cursor-pointer"
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

/**
 * Props for the FilterCheckboxInput component.
 */
interface FilterCheckboxInputProps {
    /** Unique identifier for the checkbox and tooltip */
    readonly id: string
    /** Label displayed next to the checkbox */
    readonly label: string
    /** Optional tooltip content displayed in a hint popover */
    readonly tooltip: string | undefined
    /** Whether the checkbox is currently checked */
    readonly isChecked: boolean
    /** Change handler for the checkbox */
    readonly onChange: (isChecked: boolean) => void
}

/**
 * Opens a hint popover anchored to its trigger if it is not already visible.
 * @param popoverId - The ID of the popover to open
 * @param source - The element used as the popover anchor
 */
function showHintPopover(popoverId: string, source: HTMLElement) {
    const popover = document.getElementById(popoverId)
    if (popover && !popover.matches(':popover-open')) {
        popover.showPopover({ source })
    }
}

/**
 * Closes a hint popover if it is currently visible.
 * @param popoverId - The ID of the popover to close
 */
function hideHintPopover(popoverId: string) {
    const popover = document.getElementById(popoverId)
    if (popover?.matches(':popover-open')) {
        popover.hidePopover()
    }
}

/**
 * Checkbox filter with an optional hover/focus hint popover.
 * @param props - Component props
 * @param props.id - Unique identifier for the checkbox and tooltip
 * @param props.label - Label displayed next to the checkbox
 * @param props.tooltip - Optional tooltip content displayed in a hint popover
 * @param props.isChecked - Whether the checkbox is currently checked
 * @param props.onChange - Change handler for the checkbox
 * @returns Checkbox filter input and optional tooltip trigger.
 */
function FilterCheckboxInput({ id, label, tooltip, isChecked, onChange }: FilterCheckboxInputProps) {
    const popoverId = `${id}-hint`

    return (
        <div className="flex items-center gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer group">
                <input
                    aria-describedby={tooltip ? popoverId : undefined}
                    checked={isChecked}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 accent-[#D50209] cursor-pointer"
                    onChange={e => {
                        onChange(e.target.checked)
                    }}
                    type="checkbox"
                />
                <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
            </label>
            {tooltip && (
                <>
                    <button
                        aria-label={`Show ${label} filter hint`}
                        // eslint-disable-next-line max-len
                        className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-xs font-semibold text-gray-400 transition-colors hover:border-brand-500 hover:text-brand-500 focus:outline-none cursor-help"
                        onBlur={() => {
                            hideHintPopover(popoverId)
                        }}
                        onFocus={e => {
                            showHintPopover(popoverId, e.currentTarget)
                        }}
                        onMouseEnter={e => {
                            showHintPopover(popoverId, e.currentTarget)
                        }}
                        onMouseLeave={() => {
                            hideHintPopover(popoverId)
                        }}
                        popoverTarget={popoverId}
                        type="button"
                    >
                        ?
                    </button>
                    <div
                        // eslint-disable-next-line max-len
                        className="mx-0 mt-0 mb-2 max-w-xs rounded-xl border border-gray-700 bg-gray-950 p-3 text-xs leading-relaxed text-gray-200 shadow-2xl whitespace-pre-line [position-area:top] backdrop:bg-transparent"
                        id={popoverId}
                        popover="hint"
                        role="tooltip"
                    >
                        {tooltip}
                    </div>
                </>
            )}
        </div>
    )
}

// ── ArchiveFilters ────────────────────────────────────────────────────────────

interface ArchiveFiltersProps {
    /** Shows to display and filter */
    readonly shows: Array<ArchiveShow>
    /** Current archive query */
    readonly query: ArchiveQuery
    /** Callback when query changes */
    readonly onQueryChange: (query: ArchiveQuery) => void
    /** Whether the filter panel is open by default (server-detected from User-Agent) */
    readonly defaultOpen: boolean
}

/**
 * Filter panel for the archive page.
 * Renders year/country/city/song selectors, checkbox toggles, and sort order.
 * @returns Filter UI for refining the list of shows displayed in the archive.
 */
export default function ArchiveFilters({ shows, query, onQueryChange, defaultOpen }: ArchiveFiltersProps) {
    const [areFiltersOpen, setAreFiltersOpen] = useState(defaultOpen)

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

    const facets = useMemo(() => buildArchiveFacets(shows), [shows])

    /**
     * Helper function to update a single filter value while keeping the rest unchanged.
     * @param key - The filter key to update
     * @param value - The new value for the specified filter key
     */
    function patch<K extends keyof ArchiveQuery>(key: K, value: ArchiveQuery[K]) {
        onQueryChange(patchArchiveQuery(query, key, value))
    }

    const countryFlagSrc = query.country ? flagUrl(query.country) : null
    const isFiltered = isArchiveQueryActive(query)

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex items-center justify-between">
                <button
                    className="sm:hidden flex items-center gap-1.5 cursor-pointer"
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
                <p className="hidden sm:block text-xs font-semibold text-gray-400 uppercase tracking-widest">Filters</p>
                <button
                    // eslint-disable-next-line max-len
                    className="text-xs text-brand-500 hover:text-brand-400 transition-colors font-medium px-2 py-1 rounded-lg hover:bg-brand-500/10 cursor-pointer disabled:text-stone-600 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    disabled={!isFiltered}
                    onClick={() => {
                        onQueryChange(DEFAULT_ARCHIVE_QUERY)
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
                <div className="overflow-hidden mt-2">
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
                                    className="appearance-none w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                                    id="filter-year"
                                    onChange={e => {
                                        patch('year', e.target.value)
                                    }}
                                    value={query.year}
                                >
                                    <option value="">All years</option>
                                    {facets.years.map(y => (
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
                                        alt={query.country}
                                        className="w-5 h-3.5 rounded-sm object-cover shadow shrink-0 text-transparent"
                                        height={14}
                                        src={countryFlagSrc}
                                        width={20}
                                    />
                                )}
                                <div className="relative flex-1">
                                    <select
                                        // eslint-disable-next-line max-len
                                        className="appearance-none w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                                        id="filter-country"
                                        onChange={e => {
                                            patch('country', e.target.value)
                                        }}
                                        value={query.country}
                                    >
                                        <option value="">All countries</option>
                                        {facets.countries.map(c => (
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
                            options={facets.cities}
                            placeholder="e.g. Gothenburg"
                            value={query.city}
                        />

                        <ClearableInput
                            id="filter-song"
                            label="Song in setlist"
                            listId="song-list"
                            onChange={v => {
                                patch('song', v)
                            }}
                            options={facets.songs}
                            placeholder="e.g. The Jester Race"
                            value={query.song}
                        />
                    </div>

                    {/* Secondary filters */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-gray-800/50">
                        {CHECKBOX_FILTERS.map(({ key, label, tooltip }) => (
                            <FilterCheckboxInput
                                id={`filter-${key}`}
                                isChecked={query[key]}
                                key={key}
                                label={label}
                                onChange={isChecked => {
                                    patch(key, isChecked)
                                }}
                                tooltip={tooltip}
                            />
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
                                    className="appearance-none bg-gray-800 border border-gray-700 text-gray-200 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                                    id="sort-select"
                                    onChange={e => {
                                        patch('sort', e.target.value as ArchiveSortOrder)
                                    }}
                                    value={query.sort}
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
