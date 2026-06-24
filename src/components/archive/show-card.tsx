'use client'

import { memo } from 'react'
import { getArchiveShowDateDisplay, getArchiveShowYear } from 'lib/archive/shows'
import { CommentPopover, Setlist, ShowBadges, ShowFlag, ShowLinks, ShowThumbnail } from 'components/archive/show-shared'
import type { ArchiveShow } from 'lib/archive/shows'

// ── ShowCard ──────────────────────────────────────────────────────────────────

/**
 * Individual show card component displaying concert details, thumbnail, setlist, and links.
 * Lazily loads thumbnails when the card becomes visible.
 * @returns JSX.Element
 */
const ShowCard = memo(function ShowCard({
    show,
    priority = false,
}: {
    /** Show data to display */
    readonly show: ArchiveShow
    /** Whether to eagerly load and preload the thumbnail (set only for the first/LCP card) */
    // eslint-disable-next-line react/require-default-props
    readonly priority?: boolean
}) {
    const year = getArchiveShowYear(show)
    const date = getArchiveShowDateDisplay(show)

    return (
        <article className="show-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
            <ShowThumbnail
                className="h-36 border-b border-gray-800"
                date={date}
                overlay={
                    year ? (
                        <span className="text-[11px] font-mono tabular-nums font-medium text-gray-300 bg-gray-950/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                            {year}
                        </span>
                    ) : null
                }
                priority={priority}
                show={show}
                sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 296px"
            />
            <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Location */}
                <div className="flex items-start gap-2 min-w-0">
                    <h3 className="flex-1 min-w-0">
                        <span className="flex items-center gap-2 min-w-0">
                            <ShowFlag country={show.country} />
                            <span className="min-w-0 truncate font-semibold text-gray-100 leading-snug">
                                {show.city || show.country || 'Unknown'}
                            </span>
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 flex-wrap text-xs font-normal text-gray-400">
                            <span>{show.country || 'Unknown'}</span>
                            <span className="text-gray-500">·</span>
                            <span className="font-mono">{date}</span>
                        </span>
                    </h3>
                    <CommentPopover comment={show.comment} />
                </div>

                {/* Badges */}
                <ShowBadges show={show} />
            </div>

            {/* Setlist */}
            <Setlist songs={show.songs} />

            {/* Links footer */}
            <ShowLinks
                className="px-4 py-3 border-t border-gray-800/50 bg-gray-950/40"
                show={show}
            />
        </article>
    )
})

export default ShowCard
