'use client'

import { memo } from 'react'
import ReportIssueLink from 'components/shared/report-issue-link'
import { MediaThumbnail, ThumbnailBadges, WatchLink } from 'components/shared/media'
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
 * Card for a one-off performance, in the same layout as the show cards: still, event, date, songs and note, then links.
 * The sheet title is left out: it repeats the event and the song without adding anything.
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
    const analyticsTitle = getMiscPerformanceAnalyticsTitle(performance)
    const songLine = performance.songs.join(' / ')

    return (
        <article className="show-card flex flex-col min-w-0">
            <MediaThumbnail
                alt={getMiscPerformanceImageAlt(performance)}
                className="aspect-video rounded-lg mb-3"
                href={performance.mediaLink}
                onClick={() => {
                    trackMediaClick({ link: performance.mediaLink, title: analyticsTitle, source: 'thumbnail' })
                }}
                overlay={
                    <ThumbnailBadges
                        hasProShot={performance.availability.hasProShot}
                        year={getMiscPerformanceYear(performance)}
                    />
                }
                priority={priority}
                sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 296px"
                thumbnailPath={buildMiscThumbnailPath(performance)}
            />
            <div className="mb-2.5 min-w-0">
                <h3 className="text-[15px] font-semibold leading-snug text-gray-100">{performance.event || 'Unknown event'}</h3>
                <p className="mt-1 text-xs text-gray-400">
                    {getMiscPerformanceDateDisplay(performance)}
                    {performance.availability.hasVideo && ' · Video'}
                </p>
                {songLine && (
                    <p
                        className="mt-1.5 truncate text-xs text-gray-300"
                        title={songLine}
                    >
                        {songLine}
                    </p>
                )}
                {performance.comment && (
                    <p
                        className="mt-1 truncate text-xs text-gray-400"
                        title={performance.comment}
                    >
                        {performance.comment}
                    </p>
                )}
            </div>
            <div className="mt-auto flex items-center justify-end gap-4 border-t border-gray-800 text-[13px]">
                {performance.mediaLink && (
                    <WatchLink
                        href={performance.mediaLink}
                        onClick={() => {
                            trackMediaClick({ link: performance.mediaLink, title: analyticsTitle, source: 'footer' })
                        }}
                    />
                )}
                <ReportIssueLink
                    mediaLink={performance.mediaLink}
                    title={getMiscPerformanceImageAlt(performance)}
                />
            </div>
        </article>
    )
})

export default PerformanceCard
