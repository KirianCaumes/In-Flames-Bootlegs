'use client'

import { useState } from 'react'
import ReportIssueLink from 'components/shared/report-issue-link'
import { CommentPopover, CountryFlag, MediaThumbnail, ThumbnailBadges, WatchLink } from 'components/shared/media'
import { trackBootlegClick } from 'lib/archive/analytics'
import {
    getArchiveShowDateDisplay,
    getArchiveShowImageAlt,
    getArchiveShowVenue,
    getArchiveShowYear,
    type ArchiveShow,
} from 'lib/archive/shows'
import { buildShowThumbnailPath } from 'lib/archive/thumbnails'

/**
 * Thumbnail of a show, with its year and, for pro shots, a badge layered over it.
 * @returns JSX.Element
 */
export function ShowThumbnail({
    show,
    className,
    sizes,
    priority = false,
}: {
    /** Show whose thumbnail to render. */
    readonly show: ArchiveShow
    /** Classes controlling the thumbnail box size. */
    readonly className: string
    /** Responsive sizes attribute for the image. */
    readonly sizes: string
    /** Whether to eagerly load and preload the thumbnail (set only for the first/LCP card) */
    readonly priority?: boolean
}) {
    return (
        <MediaThumbnail
            alt={getArchiveShowImageAlt(show)}
            className={className}
            href={show.mediaLink}
            onClick={() => {
                trackBootlegClick({ show, source: 'thumbnail' })
            }}
            overlay={
                <ThumbnailBadges
                    hasProShot={show.availability.hasProShot}
                    year={getArchiveShowYear(show)}
                />
            }
            priority={priority}
            sizes={sizes}
            thumbnailPath={buildShowThumbnailPath(show, getArchiveShowDateDisplay(show))}
        />
    )
}

/**
 * Place, date, venue and available recordings of a show, with its note.
 * @returns JSX.Element
 */
export function ShowSummary({
    show,
}: {
    /** Show to describe. */
    readonly show: ArchiveShow
}) {
    const date = getArchiveShowDateDisplay(show)
    const venueLabel = getArchiveShowVenue(show)
    const metaLine = [show.country || 'Unknown', date, venueLabel].filter(Boolean).join(' · ')
    // Pro shot is badged on the thumbnail.
    const recordings = [show.availability.isFullShow && 'Full show', show.availability.hasVideo && 'Video'].filter(Boolean).join(' · ')

    return (
        <div className="mb-2.5 min-w-0">
            <div className="flex items-start gap-2 min-w-0">
                <h3 className="flex-1 min-w-0 flex items-center gap-2 text-[15px] font-semibold leading-snug text-gray-100">
                    <CountryFlag country={show.country} />
                    <span className="min-w-0 truncate">{show.city || show.country || 'Unknown'}</span>
                </h3>
                <CommentPopover comment={show.comment} />
            </div>
            <p
                className="mt-1 truncate text-xs text-gray-400"
                title={metaLine}
            >
                {show.country || 'Unknown'} · {date}
                {venueLabel && ` · ${venueLabel}`}
            </p>
            {recordings && <p className="mt-1.5 text-xs text-gray-300">{recordings}</p>}
        </div>
    )
}

/**
 * Footer of a show: the setlist toggle, the external links (Setlist.fm, Watch) and the report link,
 * with the setlist unfolding below.
 * @returns JSX.Element
 */
export function ShowFooter({
    show,
}: {
    /** Show whose footer to render. */
    readonly show: ArchiveShow
}) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="mt-auto border-t border-gray-800 text-[13px]">
            <div className="flex items-center gap-4">
                {show.songs.length > 0 && (
                    <button
                        aria-expanded={isOpen}
                        className="inline-flex items-center gap-1.5 h-11 text-gray-400 hover:text-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                            setIsOpen(o => !o)
                        }}
                        type="button"
                    >
                        Setlist <span className="tabular-nums">{show.songs.length}</span>
                        <svg
                            aria-hidden="true"
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M6 9l6 6 6-6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                            />
                        </svg>
                    </button>
                )}
                <div className="ml-auto flex items-center gap-4">
                    {show.setlistFmLink && (
                        <a
                            className="inline-flex items-center min-h-11 text-gray-400 hover:text-gray-100 transition-colors"
                            href={show.setlistFmLink}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Setlist.fm
                        </a>
                    )}
                    {show.mediaLink && (
                        <WatchLink
                            href={show.mediaLink}
                            onClick={() => {
                                trackBootlegClick({ show, source: 'footer' })
                            }}
                        />
                    )}
                    <ReportIssueLink
                        mediaLink={show.mediaLink}
                        title={getArchiveShowImageAlt(show)}
                    />
                </div>
            </div>
            <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isOpen ? 'max-h-[1200px]' : 'max-h-0'}`}>
                <ol className="pb-2 space-y-0.5">
                    {show.songs.map((s, i) => (
                        <li
                            className="flex gap-2 text-xs leading-relaxed"
                            // eslint-disable-next-line react/no-array-index-key
                            key={i}
                        >
                            <span className="text-gray-500 w-5 shrink-0 text-right select-none">{i + 1}.</span>
                            <span className="text-gray-400">{s}</span>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    )
}
