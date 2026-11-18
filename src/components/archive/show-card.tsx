'use client'

import { memo } from 'react'
import { ShowFooter, ShowSummary, ShowThumbnail } from 'components/archive/show-shared'
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
    return (
        <article className="show-card flex flex-col min-w-0">
            <ShowThumbnail
                className="aspect-video rounded-lg mb-3"
                priority={priority}
                show={show}
                sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 33vw, 296px"
            />
            <ShowSummary show={show} />
            <ShowFooter show={show} />
        </article>
    )
})

export default ShowCard
