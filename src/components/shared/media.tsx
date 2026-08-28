'use client'

import { useId, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { flagUrl } from 'lib/archive/flags'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Media availability flags driving the badges. `isFullShow` only applies to full concerts. */
export interface MediaAvailability {
    /** Whether professionally recorded video footage exists. */
    readonly hasProShot: boolean
    /** Whether any video footage exists. */
    readonly hasVideo: boolean
    /** Whether a complete show recording exists. */
    readonly isFullShow?: boolean
}

/** A single external link rendered in a card's footer. */
export interface MediaLink {
    /** Link URL. */
    href: string
    /** CSS classes for the link. */
    cls: string
    /** Icon component for the link. */
    icon: ReactNode
    /** Label for the link. */
    label: string
    /** Optional click handler. */
    onClick?: () => void
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

/**
 * Watch/play icon SVG component for video links.
 * @returns JSX.Element
 */
export function WatchIcon({
    className = 'w-3.5 h-3.5',
}: {
    /** Optional classes for sizing and styling. */
    readonly className?: string
}) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
            />
            <path
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
            />
        </svg>
    )
}

/**
 * Music note icon SVG component for setlist links.
 * @returns JSX.Element
 */
export function MusicIcon({
    className = 'w-3.5 h-3.5',
}: {
    /** Optional classes for sizing and styling. */
    readonly className?: string
}) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                // eslint-disable-next-line max-len
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
            />
        </svg>
    )
}

/**
 * Video camera icon used for the Pro Shot badge.
 * @returns JSX.Element
 */
function VideoCameraIcon() {
    return (
        <svg
            className="w-3 h-3 text-brand-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                // eslint-disable-next-line max-len
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
            />
        </svg>
    )
}

/**
 * Play-circle icon used for the Video badge.
 * @returns JSX.Element
 */
function PlayCircleIcon() {
    return (
        <svg
            className="w-3 h-3 text-sky-400"
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
                d="M10 9l5 3-5 3V9z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
            />
        </svg>
    )
}

/**
 * Check-circle icon used for the Full Show badge.
 * @returns JSX.Element
 */
function CheckCircleIcon() {
    return (
        <svg
            className="w-3 h-3 text-emerald-400"
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
                d="M8.5 12.5l2.5 2.5 4.5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
            />
        </svg>
    )
}

/**
 * Badge configuration for media attributes.
 * All badges share one neutral pill; only the icon carries a subtle accent color.
 */
const BADGES: Array<{
    /** Availability key driving badge visibility. */
    key: keyof MediaAvailability
    /** Human readable label. */
    label: string
    /** Accent icon for the badge. */
    icon: ReactNode
}> = [
    { key: 'hasProShot', label: 'Pro Shot', icon: <VideoCameraIcon /> },
    { key: 'hasVideo', label: 'Video', icon: <PlayCircleIcon /> },
    { key: 'isFullShow', label: 'Full Show', icon: <CheckCircleIcon /> },
]

// ── Shared sub-components ───────────────────────────────────────────────────────

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
 * Renders the attribute badges (Pro Shot, Video, Full Show) for an entry.
 * @returns JSX.Element or null when no badge applies.
 */
export function MediaBadges({
    availability,
    className = '',
}: {
    /** Availability flags driving the badges. */
    readonly availability: MediaAvailability
    /** Extra container classes. */
    readonly className?: string
}) {
    const badges = BADGES.filter(b => availability[b.key])
    if (badges.length === 0) {
        return null
    }
    return (
        <div className={`flex flex-wrap gap-1.5 ${className}`}>
            {badges.map(({ label, icon }) => (
                <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-700/60 bg-gray-800 text-gray-300"
                    key={label}
                >
                    {icon}
                    {label}
                </span>
            ))}
        </div>
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
                className="mx-0 mt-0 mb-2 max-w-xs rounded-xl border border-gray-700 bg-gray-950 p-3 text-xs leading-relaxed text-gray-200 shadow-2xl whitespace-pre-line [position-area:top] backdrop:bg-transparent"
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

/**
 * Renders the external links available for an entry.
 * Returns null when there is no link, so the surrounding footer is omitted.
 * @returns JSX.Element or null.
 */
export function MediaLinks({
    links,
    className = '',
}: {
    /** Links to render. */
    readonly links: Array<MediaLink>
    /** Extra container classes. */
    readonly className?: string
}) {
    if (links.length === 0) {
        return null
    }

    return (
        <div className={`flex items-center gap-4 flex-wrap ${className}`}>
            {links.map(({ href, cls, icon, label, onClick }) => (
                <a
                    className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${cls}`}
                    href={href}
                    key={label}
                    onClick={onClick}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {icon}
                    {label}
                </a>
            ))}
        </div>
    )
}
