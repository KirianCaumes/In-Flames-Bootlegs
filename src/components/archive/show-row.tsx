'use client'

import { memo } from 'react'
import { CommentPopover, Setlist, ShowBadges, ShowFlag, ShowLinks, ShowThumbnail } from 'components/archive/show-shared'
import { getArchiveShowDateDisplay, type ArchiveShow } from 'lib/archive/shows'

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
                    <div className="flex items-center gap-2 min-w-0">
                        <ShowFlag country={show.country} />
                        <h2 className="font-semibold text-gray-100 leading-snug truncate">{show.city || show.country || 'Unknown'}</h2>
                        <CommentPopover comment={show.comment} />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-400">
                        <span>{show.country || 'Unknown'}</span>
                        <span className="text-gray-500">·</span>
                        <span>{date}</span>
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
