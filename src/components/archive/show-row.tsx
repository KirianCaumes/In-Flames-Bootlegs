'use client'

import { memo } from 'react'
import { CommentPopover, Setlist, ShowBadges, ShowFlag, ShowLinks, ShowThumbnail } from 'components/archive/show-shared'
import { getArchiveShowDateDisplay, getArchiveShowVenue, type ArchiveShow } from 'lib/archive/shows'

// ── ShowRow ───────────────────────────────────────────────────────────────────

/**
 * Compact horizontal show entry used by the timeline view.
 * @returns JSX.Element
 */
const ShowRow = memo(function ShowRow({
    show,
}: {
    /** Show data to display. */
    readonly show: ArchiveShow
}) {
    const date = getArchiveShowDateDisplay(show)
    const venueLabel = getArchiveShowVenue(show)
    const metaLine = [show.country || 'Unknown', date, venueLabel].filter(Boolean).join(' · ')

    return (
        <article className="show-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex flex-col gap-4 p-3 sm:flex-row">
                <ShowThumbnail
                    className="w-full h-44 sm:w-56 sm:h-32 rounded-lg"
                    date={date}
                    show={show}
                    sizes="(max-width: 639px) 160px, 224px"
                />
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="flex items-start gap-2 min-w-0">
                        <h3 className="flex-1 min-w-0">
                            <span className="flex items-center gap-2 min-w-0">
                                <ShowFlag country={show.country} />
                                <span className="min-w-0 truncate font-semibold text-gray-100 leading-snug">
                                    {show.city || show.country || 'Unknown'}
                                </span>
                            </span>
                            <span
                                className="mt-1 flex items-center gap-1.5 text-xs font-normal text-gray-400 min-w-0"
                                title={metaLine}
                            >
                                <span className="shrink-0">{show.country || 'Unknown'}</span>
                                <span className="text-gray-500 shrink-0">·</span>
                                <span className="font-mono shrink-0">{date}</span>
                                {venueLabel && (
                                    <>
                                        <span className="text-gray-500 shrink-0">·</span>
                                        <span className="truncate min-w-0">{venueLabel}</span>
                                    </>
                                )}
                            </span>
                        </h3>
                        <CommentPopover comment={show.comment} />
                    </div>
                    <ShowBadges show={show} />
                    <ShowLinks
                        className="mt-auto pt-1"
                        show={show}
                    />
                </div>
            </div>
            <Setlist songs={show.songs} />
        </article>
    )
})

export default ShowRow
