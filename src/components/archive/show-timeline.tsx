'use client'

import { useMemo } from 'react'
import ShowRow from 'components/archive/show-row'
import { groupShowsByYear } from 'lib/archive/view'
import type { ArchiveShow } from 'lib/archive/shows'

// ── ShowTimeline ────────────────────────────────────────────────────────────────

/**
 * Timeline view of archive shows, grouped by year along a vertical rail.
 * @returns JSX.Element
 */
export default function ShowTimeline({
    shows,
}: {
    /** Shows to display, already filtered and sorted. */
    readonly shows: Array<ArchiveShow>
}) {
    const groups = useMemo(() => groupShowsByYear(shows), [shows])

    return (
        <div className="space-y-10">
            {groups.map(group => (
                <section key={group.year}>
                    {/* Year header */}
                    <div className="sticky top-[5.5rem] z-20 -mx-4 mb-4 flex items-center gap-3 bg-gray-950/90 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6">
                        <span className="text-2xl font-display font-bold text-brand-500 tabular-nums tracking-wide">{group.year}</span>
                        <span className="text-xs text-gray-500 font-mono">
                            {group.shows.length} {group.shows.length === 1 ? 'show' : 'shows'}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-800 to-transparent" />
                    </div>

                    {/* Rail */}
                    <div className="relative ml-2 border-l-2 border-gray-800/70 pl-5 sm:pl-7 space-y-4">
                        {group.shows.map((show, i) => (
                            <div
                                className="relative"
                                // eslint-disable-next-line react/no-array-index-key
                                key={`${show.id}-${i}`}
                            >
                                <span
                                    // eslint-disable-next-line max-len
                                    className="absolute top-7 -left-[calc(1.25rem+7px)] sm:-left-[calc(1.75rem+7px)] w-3 h-3 rounded-full bg-brand-500 ring-4 ring-gray-950"
                                />
                                <ShowRow show={show} />
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}
