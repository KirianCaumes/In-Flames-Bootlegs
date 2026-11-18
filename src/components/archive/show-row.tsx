'use client'

import { memo } from 'react'
import { ShowFooter, ShowSummary, ShowThumbnail } from 'components/archive/show-shared'
import type { ArchiveShow } from 'lib/archive/shows'

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
    return (
        <article className="show-card flex flex-col gap-4 sm:flex-row">
            <ShowThumbnail
                className="w-full sm:w-56 aspect-video rounded-lg"
                show={show}
                sizes="(max-width: 639px) 160px, 224px"
            />
            <div className="flex flex-col flex-1 min-w-0">
                <ShowSummary show={show} />
                <ShowFooter show={show} />
            </div>
        </article>
    )
})

export default ShowRow
