'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import SearchInput from 'components/shared/search-input'
import { flagUrl } from 'lib/archive/flags'
import { buildArchiveFacets, DEFAULT_ARCHIVE_QUERY, getArchiveQueryChips, isArchiveQueryActive, patchArchiveQuery } from 'lib/archive/query'
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
    tooltip: string
}> = [
    {
        key: 'proshot',
        label: 'Pro shot',
        tooltip:
            // eslint-disable-next-line max-len
            'Shows with professionally recorded video and/or audio footage available.\nNote: for some old shows it is difficult to classify the quality of the footage as pro shot or amateur.',
    },
    { key: 'video', label: 'Has video', tooltip: 'Shows with any kind of video footage available, including amateur recordings.' },
    { key: 'full', label: 'Full show', tooltip: 'Shows with a complete setlist recorded.' },
]

const FIELD_CLASS_NAME =
    // eslint-disable-next-line max-len
    'h-11 w-full bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all'

// ── Shared sub-components ─────────────────────────────────────────────────────

/**
 * Chevron down SVG icon used in select dropdowns.
 * Positioned absolutely within relative containers.
 * @returns SVG element representing a downward pointing chevron.
 */
export function ChevronDown() {
    return (
        <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
                    className={`${FIELD_CLASS_NAME} px-3 pr-9 placeholder-gray-400 [&::-webkit-calendar-picker-indicator]:!hidden`}
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
 * Props for the FilterToggle component.
 */
interface FilterToggleProps {
    /** Unique identifier for the button and its hint */
    readonly id: string
    /** Label of the button */
    readonly label: string
    /** Hint shown in a popover while the button is hovered or focused */
    readonly tooltip: string
    /** Whether the filter is on */
    readonly isPressed: boolean
    /** Change handler for the filter */
    readonly onChange: (isPressed: boolean) => void
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
 * Toggle button filter, with a hint popover shown on hover and focus.
 * @param props - Component props
 * @param props.id - Unique identifier for the button and its hint
 * @param props.label - Label of the button
 * @param props.tooltip - Hint shown in a popover while the button is hovered or focused
 * @param props.isPressed - Whether the filter is on
 * @param props.onChange - Change handler for the filter
 * @returns Toggle button and its hint popover.
 */
function FilterToggle({ id, label, tooltip, isPressed, onChange }: FilterToggleProps) {
    const popoverId = `${id}-hint`

    return (
        <>
            <button
                aria-describedby={popoverId}
                aria-pressed={isPressed}
                // eslint-disable-next-line max-len
                className={`h-11 px-3.5 rounded-lg border text-sm transition-colors cursor-pointer ${isPressed ? 'border-brand-500 text-brand-500 font-medium' : 'border-gray-700 text-gray-300 hover:text-gray-100'}`}
                id={id}
                onBlur={() => {
                    hideHintPopover(popoverId)
                }}
                onClick={() => {
                    onChange(!isPressed)
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
                type="button"
            >
                {label}
            </button>
            <div
                // eslint-disable-next-line max-len
                className="mx-0 mt-0 mb-2 max-w-xs rounded-lg border border-gray-700 bg-gray-950 p-3 text-xs leading-relaxed text-gray-200 shadow-2xl whitespace-pre-line [position-area:top] backdrop:bg-transparent"
                id={popoverId}
                popover="hint"
                role="tooltip"
            >
                {tooltip}
            </div>
        </>
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
}

/**
 * Filter row for the archive page.
 * The search, year, country and the three toggles stay visible; city, venue, song and sort order are collapsed
 * behind a "More filters" toggle by default, at every size.
 * Active collapsed filters stay visible as chips above the results and as a count on the toggle.
 * @returns Filter UI for refining the list of shows displayed in the archive.
 */
export default function ArchiveFilters({ shows, query, onQueryChange }: ArchiveFiltersProps) {
    const [areFiltersOpen, setAreFiltersOpen] = useState(false)

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
    const detailedFilterCount = getArchiveQueryChips(query).filter(chip => ['city', 'venue', 'song'].includes(chip.key)).length

    return (
        <div className="mb-4">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex-[999_1_320px] min-w-0">
                    <SearchInput
                        id="filter-search"
                        label="Search shows"
                        onChange={v => {
                            patch('q', v)
                        }}
                        placeholder="Search a city, festival, song, year... e.g. hellfest 2011"
                        value={query.q}
                    />
                </div>

                <div className="relative flex-[1_1_140px]">
                    <label
                        className="sr-only"
                        htmlFor="filter-year"
                    >
                        Year
                    </label>
                    <select
                        className={`${FIELD_CLASS_NAME} appearance-none pl-3 pr-10 cursor-pointer`}
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

                <div className="flex flex-[1_1_150px] items-center gap-2">
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
                        <label
                            className="sr-only"
                            htmlFor="filter-country"
                        >
                            Country
                        </label>
                        <select
                            className={`${FIELD_CLASS_NAME} appearance-none pl-3 pr-10 cursor-pointer`}
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

                {CHECKBOX_FILTERS.map(({ key, label, tooltip }) => (
                    <FilterToggle
                        id={`filter-${key}`}
                        isPressed={query[key]}
                        key={key}
                        label={label}
                        onChange={isPressed => {
                            patch(key, isPressed)
                        }}
                        tooltip={tooltip}
                    />
                ))}

                <button
                    aria-controls="archive-detailed-filters"
                    aria-expanded={areFiltersOpen}
                    className="inline-flex items-center gap-1.5 h-11 px-1.5 text-sm text-gray-400 hover:text-gray-100 transition-colors cursor-pointer"
                    onClick={() => {
                        setAreFiltersOpen(prev => !prev)
                    }}
                    type="button"
                >
                    More filters
                    {detailedFilterCount > 0 && (
                        <span className="rounded bg-brand-500 px-1.5 text-[11px] font-semibold leading-5 text-gray-950 tabular-nums">
                            <span className="sr-only">(</span>
                            {detailedFilterCount}
                            <span className="sr-only"> active)</span>
                        </span>
                    )}
                    <svg
                        aria-hidden="true"
                        className={`w-4 h-4 transition-transform duration-200 ${areFiltersOpen ? 'rotate-180' : ''}`}
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
            </div>

            <div
                className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${areFiltersOpen ? 'max-h-[1200px]' : 'max-h-0'}`}
                id="archive-detailed-filters"
                // Keeps the collapsed controls out of the tab order.
                inert={!areFiltersOpen}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto] items-end gap-3 pt-4">
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
                        id="filter-venue"
                        label="Festival / venue"
                        listId="venue-list"
                        onChange={v => {
                            patch('venue', v)
                        }}
                        options={facets.venues}
                        placeholder="e.g. Wacken Open Air"
                        value={query.venue}
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

                    <div className="flex flex-col gap-1">
                        <label
                            className="text-xs text-gray-400 font-medium"
                            htmlFor="sort-select"
                        >
                            Sort
                        </label>
                        <div className="relative">
                            <select
                                className={`${FIELD_CLASS_NAME} appearance-none pl-3 pr-10 cursor-pointer`}
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

                    <button
                        // eslint-disable-next-line max-len
                        className="h-11 px-3 rounded-lg text-sm font-medium text-brand-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer disabled:text-gray-500 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        disabled={!isFiltered}
                        onClick={() => {
                            onQueryChange(DEFAULT_ARCHIVE_QUERY)
                        }}
                        type="button"
                    >
                        Reset all
                    </button>
                </div>
            </div>
        </div>
    )
}
