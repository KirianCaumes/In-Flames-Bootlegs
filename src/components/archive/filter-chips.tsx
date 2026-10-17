'use client'

import type { ArchiveQueryChip } from 'lib/archive/query'

/**
 * Active filters as removable chips, shown above the results.
 * They keep the current filtering visible when the filter panel is collapsed on mobile.
 * @returns JSX.Element or null when no filter is active.
 */
export default function FilterChips({
    chips,
    onRemove,
    onClear,
}: {
    /** Active filters. */
    readonly chips: Array<ArchiveQueryChip>
    /** Remove one filter. */
    readonly onRemove: (key: ArchiveQueryChip['key']) => void
    /** Remove every filter. */
    readonly onClear: () => void
}) {
    if (chips.length === 0) {
        return null
    }

    return (
        <ul
            aria-label="Active filters"
            className="flex flex-wrap items-center gap-2 mb-4"
        >
            {chips.map(({ key, label }) => (
                <li key={key}>
                    <button
                        aria-label={`Remove filter ${label}`}
                        // eslint-disable-next-line max-len
                        className="inline-flex max-w-64 items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 py-1 pl-3 pr-2 text-xs font-medium text-gray-200 transition-colors hover:border-brand-500 hover:bg-brand-500/20 cursor-pointer"
                        onClick={() => {
                            onRemove(key)
                        }}
                        type="button"
                    >
                        <span className="truncate">{label}</span>
                        <svg
                            aria-hidden="true"
                            className="w-3.5 h-3.5 shrink-0 text-gray-400"
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
                </li>
            ))}
            {chips.length > 1 && (
                <li>
                    <button
                        className="px-2 py-1 text-xs font-medium text-brand-500 hover:text-brand-400 transition-colors cursor-pointer"
                        onClick={onClear}
                        type="button"
                    >
                        Clear all
                    </button>
                </li>
            )}
        </ul>
    )
}
