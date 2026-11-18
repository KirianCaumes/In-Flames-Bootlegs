'use client'

import { useId, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { flagUrl } from 'lib/archive/flags'

// ── Shared sub-components ───────────────────────────────────────────────────────

/**
 * Year and pro-shot badges layered over a thumbnail, passed as its overlay.
 * @returns JSX.Element
 */
export function ThumbnailBadges({
    year,
    hasProShot,
}: {
    /** Year of the entry, or null when unknown. */
    readonly year: number | null
    /** Whether professionally recorded footage exists. */
    readonly hasProShot: boolean
}) {
    return (
        <>
            {year !== null && (
                <span className="absolute top-2 left-2 rounded bg-gray-950/80 px-1.5 py-0.5 text-[11px] tabular-nums text-gray-100">
                    {year}
                </span>
            )}
            {hasProShot && (
                <span className="absolute top-2 right-2 rounded bg-brand-500 px-1.5 py-0.5 text-[11px] font-semibold text-gray-950">
                    Pro shot
                </span>
            )}
        </>
    )
}

/**
 * Main action of an entry's footer, opening its media.
 * @returns JSX.Element
 */
export function WatchLink({
    href,
    onClick,
}: {
    /** Media link. */
    readonly href: string
    /** Click handler, used for analytics. */
    readonly onClick: () => void
}) {
    return (
        <a
            className="inline-flex items-center gap-1.5 min-h-11 font-semibold text-brand-500 hover:text-brand-400 transition-colors"
            href={href}
            onClick={onClick}
            rel="noopener noreferrer"
            target="_blank"
        >
            <svg
                aria-hidden="true"
                className="w-[13px] h-[13px]"
                fill="currentColor"
                viewBox="0 0 24 24"
            >
                <path d="M7 4.5v15l13-7.5z" />
            </svg>
            Watch
        </a>
    )
}

/**
 * Placeholder component displayed when a country flag cannot be resolved.
 * @returns JSX.Element
 */
function UnknownFlag() {
    return (
        <span className="w-5 h-3.5 rounded-sm bg-gray-700 shrink-0 inline-flex items-center justify-center">
            <svg
                className="w-2.5 h-2.5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                    strokeWidth={2}
                />
                <path
                    d="M12 3c-3 4-3 14 0 18M12 3c3 4 3 14 0 18M3 12h18"
                    strokeLinecap="round"
                    strokeWidth={2}
                />
            </svg>
        </span>
    )
}

/**
 * Country flag image with a graceful fallback when the country is unknown.
 * @returns JSX.Element
 */
export function CountryFlag({
    country,
}: {
    /** Country name to render a flag for. */
    readonly country: string
}) {
    const flagSrc = flagUrl(country)
    if (!flagSrc) {
        return <UnknownFlag />
    }
    return (
        <Image
            alt={country}
            className="w-5 h-3.5 rounded-sm object-cover shadow-sm shrink-0 text-transparent"
            height={14}
            loading="lazy"
            src={flagSrc}
            width={20}
        />
    )
}

/**
 * Opens a hint popover anchored to its trigger if it is not already visible.
 * @param popoverId - The ID of the popover to open.
 * @param source - The element used as the popover anchor.
 */
function showHintPopover(popoverId: string, source: HTMLElement) {
    const popover = document.getElementById(popoverId)
    if (popover && !popover.matches(':popover-open')) {
        popover.showPopover({ source })
    }
}

/**
 * Closes a hint popover if it is currently visible.
 * @param popoverId - The ID of the popover to close.
 */
function hideHintPopover(popoverId: string) {
    const popover = document.getElementById(popoverId)
    if (popover?.matches(':popover-open')) {
        popover.hidePopover()
    }
}

/**
 * Info button that reveals a comment in a popover on hover, focus, or click.
 * Adds no vertical space to the card, so cards on the same row keep equal heights.
 * @returns JSX.Element or null when there is no comment.
 */
export function CommentPopover({
    comment,
}: {
    /** Comment text to display. */
    readonly comment: string
}) {
    const popoverId = useId()
    if (!comment) {
        return null
    }
    return (
        <>
            <button
                aria-describedby={popoverId}
                aria-label="Show note"
                // eslint-disable-next-line max-len
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-[10px] font-normal italic leading-none text-gray-400 transition-colors hover:border-brand-500 hover:text-brand-500 focus:outline-none cursor-help"
                onBlur={() => {
                    hideHintPopover(popoverId)
                }}
                onClick={e => {
                    const popover = document.getElementById(popoverId)
                    if (popover?.matches(':popover-open')) {
                        hideHintPopover(popoverId)
                    } else {
                        showHintPopover(popoverId, e.currentTarget)
                    }
                }}
                onFocus={e => {
                    showHintPopover(popoverId, e.currentTarget)
                }}
                onMouseEnter={e => {
                    showHintPopover(popoverId, e.currentTarget)
                }}
                onMouseLeave={() => {
                    hideHintPopover(popoverId)
                }}
                type="button"
            >
                i
            </button>
            <div
                // eslint-disable-next-line max-len
                className="mx-0 mt-0 mb-2 max-w-xs rounded-lg border border-gray-700 bg-gray-950 p-3 text-xs leading-relaxed text-gray-200 shadow-2xl whitespace-pre-line [position-area:top] backdrop:bg-transparent"
                id={popoverId}
                popover="hint"
                role="tooltip"
            >
                {comment}
            </div>
        </>
    )
}

/**
 * Thumbnail for an entry, lazily loading the resolved image over a placeholder.
 * The image is served by `/thumbnail/[slug]`, which resolves and proxies the real thumbnail server-side.
 * @returns JSX.Element
 */
export function MediaThumbnail({
    href,
    alt,
    thumbnailPath,
    sizes,
    onClick,
    priority = false,
    className = 'h-36',
    overlay = null,
}: {
    /** Media link opened when the thumbnail is clicked. */
    readonly href: string
    /** Descriptive alt text for the image. */
    readonly alt: string
    /** Local `/thumbnail/...` path resolving the image. */
    readonly thumbnailPath: string
    /** Responsive sizes attribute for the image. */
    readonly sizes: string
    /** Click handler, used for analytics. */
    readonly onClick: () => void
    /** Whether to eagerly load and preload this image (set only for the first/LCP card). */
    readonly priority?: boolean
    /** Classes controlling the thumbnail box size. */
    readonly className?: string
    /**
     * Optional element layered over the image, positioned against the full thumbnail box so the caller places it itself.
     * It sits inside the link: overlay content stays clickable and can carry its own `title`, rather than being made inert.
     */
    readonly overlay?: ReactNode
}) {
    const [thumbStatus, setThumbStatus] = useState<'error' | 'resolved' | undefined>()

    return (
        <div className={`${className} relative overflow-hidden bg-gray-900 shrink-0`}>
            <a
                aria-label={`Watch ${alt}`}
                className="block h-full group relative"
                href={href}
                onClick={onClick}
                rel="noopener noreferrer"
                target="_blank"
            >
                <DefaultThumbnail />
                {href && thumbStatus !== 'error' && (
                    <Image
                        alt={alt}
                        // The thumb-image class lets a <noscript> style force opacity:1 when JS is disabled.
                        // Without hydration the onLoad handler that clears opacity-0 never fires.
                        // eslint-disable-next-line max-len
                        className={`thumb-image absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300 text-transparent${thumbStatus === 'resolved' ? '' : ' opacity-0'}`}
                        fill
                        loading={priority ? 'eager' : 'lazy'}
                        onError={() => {
                            setThumbStatus('error')
                        }}
                        onLoad={() => {
                            setThumbStatus('resolved')
                        }}
                        priority={priority}
                        sizes={sizes}
                        src={thumbnailPath}
                    />
                )}
                {overlay && <div className="absolute inset-0 z-10">{overlay}</div>}
            </a>
        </div>
    )
}

/**
 * Default placeholder thumbnail shown before the actual thumbnail loads or when none is available.
 * @returns JSX.Element
 */
function DefaultThumbnail() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-900 to-gray-800">
            <svg
                className="w-8 h-8 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                />
            </svg>
        </div>
    )
}
