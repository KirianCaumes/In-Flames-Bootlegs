'use client'

import { memo, type ComponentProps } from 'react'
import { getArchiveShowDateDisplay, getArchiveShowYear } from 'lib/archive/shows'
import { CommentPopover, Setlist, ShowBadges, ShowFlag, ShowLinks, ShowThumbnail } from 'components/archive/show-shared'
import type Image from 'next/image'
import type { ArchiveShow } from 'lib/archive/shows'

// ── ShowCard ──────────────────────────────────────────────────────────────────

/**
 * Individual show card component displaying concert details, thumbnail, setlist, and links.
 * Lazily loads thumbnails when the card becomes visible.
 * @returns JSX.Element
 */
const ShowCard = memo(function ShowCard({
    show,
    imageLoading = 'lazy',
}: {
    /** Show data to display */
    readonly show: ArchiveShow
    /** Image loading strategy, defaults to 'lazy' */
    // eslint-disable-next-line react/require-default-props
    readonly imageLoading?: ComponentProps<typeof Image>['loading']
}) {
    const year = getArchiveShowYear(show)
    const date = getArchiveShowDateDisplay(show)

    return (
        <article className="show-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
            <ShowThumbnail
                className="h-36 border-b border-gray-800"
                date={date}
                imageLoading={imageLoading}
                overlay={
                    year ? (
                        <span className="text-[11px] font-medium text-gray-300 bg-gray-950/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                            {year}
                        </span>
                    ) : null
                }
                show={show}
                sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 296px"
            />
            <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Location */}
                <div>
                    <div className="flex items-center gap-2 mb-1 min-w-0">
                        <ShowFlag country={show.country} />
                        <h2 className="font-semibold text-gray-100 leading-snug flex-1 min-w-0 truncate">
                            {show.city || show.country || 'Unknown'}
                        </h2>
                        <CommentPopover comment={show.comment} />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-gray-400">{show.country || 'Unknown'}</span>
                        <span className="text-gray-500 text-xs">·</span>
                        <span className="text-xs text-gray-400">{date}</span>
                    </div>
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
