'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { flagUrl } from 'lib/flags'
import { formatDate, getYear } from 'lib/date'
import type { Show } from 'lib/shows'

/**
 * Badge configuration for show attributes.
 * Defines styling and labels for Pro Shot, Video, and Full Show indicators.
 */
const BADGES = [
    {
        key: 'ProShot' as const,
        label: 'Pro Shot',
        cls: 'text-orange-300 bg-orange-900/50 border-orange-800/40',
    },
    {
        key: 'Video' as const,
        label: 'Video',
        cls: 'text-blue-300 bg-blue-900/50 border-blue-800/40',
    },
    {
        key: 'Full' as const,
        label: 'Full Show',
        cls: 'text-emerald-300 bg-emerald-900/50 border-emerald-800/40',
    },
]

// ── SVG icons ─────────────────────────────────────────────────────────────────

/**
 * Watch/play icon SVG component for video links
 * @returns JSX.Element
 */
function WatchIcon() {
    return (
        <svg
            className="w-3.5 h-3.5"
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
function MusicIcon({
    className = 'w-3.5 h-3.5',
}: {
    /** Optional classes for sizing and styling */
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

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Placeholder component displayed when a country flag cannot be resolved
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
 * Default placeholder thumbnail shown before actual thumbnail loads or if no thumbnail is available.
 * Displays a generic video icon.
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

// ── ShowCard ──────────────────────────────────────────────────────────────────

/**
 * Individual show card component displaying concert details, thumbnail, setlist, and links.
 * Lazily loads thumbnails when card becomes visible using Intersection Observer.
 * @returns JSX.Element
 */
export default function ShowCard({
    show,
}: {
    /** Show data to display */
    readonly show: Show
}) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isSetlistOpen, setIsSetlistOpen] = useState(false)
    const [thumbStatus, setThumbStatus] = useState<'error' | 'resolved' | undefined>()
    const [thumbnail, setThumbnail] = useState<string | null>(null)

    const year = getYear(show.Date)
    const songs = show.Setlist.split('\n')
        .map(s => s.trim())
        .filter(Boolean)
    const flagSrc = flagUrl(show.Country)

    useEffect(() => {
        if (!show.Link) {
            return
        }

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    const url = new URL('/api/thumbnail', window.location.origin)
                    url.searchParams.set('url', show.Link)
                    fetch(url.toString())
                        .then(r => r.json())
                        .then(
                            (data: {
                                /** Thumbnail URL or null if not available */
                                thumbnail: string | null
                            }) => {
                                setThumbnail(data.thumbnail)
                            },
                        )
                        .catch(() => {
                            /** Empty */
                        })
                    observer.disconnect()
                }
            },
            { rootMargin: '100px' },
        )

        if (cardRef.current) {
            observer.observe(cardRef.current)
        }

        return () => {
            observer.disconnect()
        }
    }, [show.Link])

    const badges = BADGES.filter(b => show[b.key] === 'Yes')

    const links: Array<{
        /** Link URL */
        href: string
        /** CSS classes for the link */
        cls: string
        /** Icon component for the link */
        icon: ReactNode
        /** Label for the link */
        label: string
    }> = []
    if (show.Link) {
        links.push({
            href: show.Link,
            cls: 'text-red-400 hover:text-red-300',
            icon: <WatchIcon />,
            label: 'Watch',
        })
    }
    if (show['Setlist.fm']) {
        links.push({
            href: show['Setlist.fm'],
            cls: 'text-lime-500 hover:text-lime-400',
            icon: <MusicIcon />,
            label: 'Setlist.fm',
        })
    }

    return (
        <article
            className="show-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col"
            ref={cardRef}
        >
            <div className="h-36 overflow-hidden bg-gray-900 border-b border-gray-800 shrink-0">
                {show.Link ? (
                    <a
                        className="block h-full group relative"
                        href={show.Link}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        <DefaultThumbnail />
                        {thumbnail && thumbStatus !== 'error' && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                alt={`In Flames – ${show.City} ${show.Country} – ${formatDate(show.Date)}`}
                                // eslint-disable-next-line max-len
                                className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300 text-transparent${thumbStatus === 'resolved' ? '' : ' opacity-0'}`}
                                loading="lazy"
                                onError={() => {
                                    setThumbStatus('error')
                                }}
                                onLoad={e => {
                                    // YouTube serves a 120×90 placeholder with HTTP 200 for unavailable videos
                                    if (e.currentTarget.naturalWidth <= 120) {
                                        setThumbStatus('error')
                                    } else {
                                        setThumbStatus('resolved')
                                    }
                                }}
                                src={thumbnail}
                            />
                        )}
                    </a>
                ) : (
                    <DefaultThumbnail />
                )}
            </div>
            <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Location */}
                <div>
                    <div className="flex items-center gap-2 mb-1 min-w-0">
                        {flagSrc ? (
                            <Image
                                alt={show.Country}
                                className="w-5 h-3.5 rounded-sm object-cover shadow-sm shrink-0 text-transparent"
                                height={14}
                                loading="lazy"
                                src={flagSrc}
                                width={20}
                            />
                        ) : (
                            <UnknownFlag />
                        )}
                        <h3 className="font-semibold text-gray-100 leading-snug flex-1 min-w-0 truncate">
                            {show.City || show.Country || 'Unknown'}
                        </h3>
                        {year && (
                            <span className="text-xs font-bold text-brand-400 bg-brand-500/15 border border-brand-500/30 px-2 py-0.5 rounded-full shrink-0">
                                {year}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-gray-400">{show.Country || 'Unknown'}</span>
                        <span className="text-gray-500 text-xs">·</span>
                        <span className="text-xs text-gray-400">{formatDate(show.Date)}</span>
                    </div>
                </div>

                {/* Badges */}
                {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {badges.map(({ label, cls }) => (
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
                                key={label}
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                )}

                {/* Comment */}
                {show.Comment && <p className="text-xs text-yellow-400 italic leading-relaxed">{show.Comment}</p>}
            </div>

            {/* Setlist */}
            {songs.length > 0 && (
                <div className="border-t border-gray-800 px-4 pt-1 pb-1">
                    <button
                        className="w-full flex items-center justify-between gap-2 text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors py-1"
                        onClick={() => {
                            setIsSetlistOpen(o => !o)
                        }}
                        type="button"
                    >
                        <span className="flex items-center gap-1.5">
                            <MusicIcon className="w-3.5 h-3.5 text-gray-400" />
                            Setlist
                            <span className="text-gray-400 font-normal">({songs.length} songs)</span>
                        </span>
                        <svg
                            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isSetlistOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M19 9l-7 7-7-7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                            />
                        </svg>
                    </button>
                    <div
                        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isSetlistOpen ? 'max-h-[1200px]' : 'max-h-0'}`}
                    >
                        <ol className="pb-1 space-y-0.5 pt-1">
                            {songs.map((s, i) => (
                                <li
                                    className="flex gap-2 text-xs leading-relaxed"
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={i}
                                >
                                    <span className="text-gray-500 w-5 shrink-0 text-right tabular-nums select-none">{i + 1}.</span>
                                    <span className="text-gray-400">{s}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            )}

            {/* Links footer */}
            {links.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-800/50 bg-gray-950/40 flex items-center gap-4 flex-wrap">
                    {links.map(({ href, cls, icon, label }) => (
                        <a
                            className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${cls}`}
                            href={href}
                            key={label}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            {icon}
                            {label}
                        </a>
                    ))}
                </div>
            )}
        </article>
    )
}
