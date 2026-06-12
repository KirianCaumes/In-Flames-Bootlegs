'use client'

import type { JSX } from 'react'
import type { ArchiveView } from 'lib/archive/view'

// ── ViewToggle ──────────────────────────────────────────────────────────────────

const OPTIONS: Array<{
    /** View value. */
    value: ArchiveView
    /** Accessible label. */
    label: string
    /** Icon element. */
    icon: JSX.Element
}> = [
    {
        value: 'grid',
        label: 'Grid view',
        icon: (
            <svg
                aria-description="Grid view icon"
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    d="M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 15h6v4H4v-4zm10 0h6v4h-6v-4z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                />
            </svg>
        ),
    },
    {
        value: 'timeline',
        label: 'Timeline view',
        icon: (
            <svg
                aria-description="Timeline view icon"
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    d="M6 4v16M6 7h13M6 12h10M6 17h13"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                />
            </svg>
        ),
    },
]

/**
 * Segmented control to switch between the grid and timeline views.
 * @returns JSX.Element
 */
export default function ViewToggle({
    view,
    onViewChange,
}: {
    /** Currently selected view. */
    readonly view: ArchiveView
    /** Callback when the view changes. */
    readonly onViewChange: (view: ArchiveView) => void
}) {
    return (
        <div className="inline-flex items-center rounded-xl border border-gray-800 bg-gray-900 p-0.5">
            {OPTIONS.map(({ value, label, icon }) => {
                const isActive = view === value
                return (
                    <button
                        aria-label={label}
                        aria-pressed={isActive}
                        // eslint-disable-next-line max-len
                        className={`flex items-center justify-center rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer ${isActive ? 'bg-gray-800 text-brand-500' : 'text-gray-500 hover:text-gray-300'}`}
                        key={value}
                        onClick={() => {
                            onViewChange(value)
                        }}
                        title={label}
                        type="button"
                    >
                        {icon}
                    </button>
                )
            })}
        </div>
    )
}
