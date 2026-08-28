'use client'

import { memo } from 'react'
import { MediaBadges, MediaLinks, MediaThumbnail, WatchIcon, type MediaLink } from 'components/shared/media'
import { trackMediaClick } from 'lib/analytics'
import {
    buildMiscThumbnailPath,
    getMiscPerformanceAnalyticsTitle,
    getMiscPerformanceDateDisplay,
    getMiscPerformanceImageAlt,
    getMiscPerformanceYear,
} from 'lib/miscellaneous/performances'
import type { MiscPerformance } from 'lib/miscellaneous/performances'

// ── PerformanceCard ───────────────────────────────────────────────────────────

/**
 * Card for a one-off performance, built around a 16:9 still.
 * The song is the subject of these entries, not the show, so it is set over the still in the display face rather than
 * listed as a badge below it. The sheet title is left out: it repeats the event and the song without adding anything.
 * @returns JSX.Element
 */
const PerformanceCard = memo(function PerformanceCard({
    performance,
    priority = false,
}: {
    /** Performance to display. */
    readonly performance: MiscPerformance
    /** Whether to eagerly load and preload the thumbnail (set only for the first/LCP card). */
    // eslint-disable-next-line react/require-default-props
    readonly priority?: boolean
}) {
    const year = getMiscPerformanceYear(performance)
    const date = getMiscPerformanceDateDisplay(performance)
    const analyticsTitle = getMiscPerformanceAnalyticsTitle(performance)
    const songLine = performance.songs.join(' / ')

    const links: Array<MediaLink> = performance.mediaLink
        ? [
              {
                  href: performance.mediaLink,
                  cls: 'text-red-400 hover:text-red-300',
                  icon: <WatchIcon />,
                  label: 'Watch',
                  onClick: () => {
                      trackMediaClick({ link: performance.mediaLink, title: analyticsTitle, source: 'footer' })
                  },
              },
          ]
        : []

    return (
        <article className="show-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col">
            <MediaThumbnail
                alt={getMiscPerformanceImageAlt(performance)}
                className="aspect-video border-b border-gray-800"
                href={performance.mediaLink}
                onClick={() => {
                    trackMediaClick({ link: performance.mediaLink, title: analyticsTitle, source: 'thumbnail' })
                }}
                overlay={
                    <>
                        {year !== null && (
                            // eslint-disable-next-line max-len
                            <span className="absolute top-2 right-2 text-[11px] font-mono tabular-nums font-medium text-gray-300 bg-gray-950/60 px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                                {year}
                            </span>
                        )}
                        {songLine && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950 via-gray-950/85 to-transparent px-4 pt-8 pb-3">
                                {/* One line whatever the song count, so every card's still is cropped the same way. */}
                                <p
                                    // eslint-disable-next-line max-len
                                    className="truncate border-l-2 border-brand-500 pl-2.5 font-display text-base font-semibold uppercase tracking-wide leading-tight text-gray-50"
                                    title={songLine}
                                >
                                    {songLine}
                                </p>
                            </div>
                        )}
                    </>
                }
                priority={priority}
                sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 296px"
                thumbnailPath={buildMiscThumbnailPath(performance)}
            />
            <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Event, date and note */}
                <div className="min-w-0">
                    <h3 className="font-semibold text-gray-100 leading-snug">{performance.event || 'Unknown event'}</h3>
                    <p className="mt-1 font-mono text-xs text-gray-400">{date}</p>
                    {performance.comment && (
                        <p
                            className="mt-2 truncate text-xs text-gray-400"
                            title={performance.comment}
                        >
                            {performance.comment}
                        </p>
                    )}
                </div>

                {/* Badges */}
                <MediaBadges
                    availability={performance.availability}
                    className="mt-auto"
                />
            </div>

            {/* Links footer */}
            <MediaLinks
                className="px-4 py-3 border-t border-gray-800/50 bg-gray-950/40"
                links={links}
            />
        </article>
    )
})

export default PerformanceCard
