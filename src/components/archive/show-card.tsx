'use client'

import { memo } from 'react'
import { Setlist, ShowLinks } from 'components/archive/show-shared'
import { CommentPopover, CountryFlag, MediaBadges, MediaThumbnail } from 'components/shared/media'
import { trackBootlegClick } from 'lib/archive/analytics'
import { getArchiveShowDateDisplay, getArchiveShowImageAlt, getArchiveShowVenue, getArchiveShowYear } from 'lib/archive/shows'
import { buildShowThumbnailPath } from 'lib/archive/thumbnails'
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
    const venueLabel = getArchiveShowVenue(show)
    const metaLine = [show.country || 'Unknown', date, venueLabel].filter(Boolean).join(' · ')

    return (
        <article className="show-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
            <MediaThumbnail
                alt={getArchiveShowImageAlt(show)}
                className="h-36 border-b border-gray-800"
                href={show.mediaLink}
                onClick={() => {
                    trackBootlegClick({ show, source: 'thumbnail' })
                }}
                overlay={
                    year ? (
                        // eslint-disable-next-line max-len
                        <span className="absolute top-2 right-2 text-[11px] font-mono tabular-nums font-medium text-gray-300 bg-gray-950/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                            {year}
                        </span>
                    ) : null
                }
                priority={priority}
                sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 296px"
                thumbnailPath={buildShowThumbnailPath(show, date)}
            />
            <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Location */}
                <div className="flex items-start gap-2 min-w-0">
                    <h3 className="flex-1 min-w-0">
                        <span className="flex items-center gap-2 min-w-0">
                            <CountryFlag country={show.country} />
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

                {/* Badges */}
                <MediaBadges availability={show.availability} />
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
