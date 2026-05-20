'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Show } from '@/lib/shows'
import { flagUrl } from '@/lib/flags'
import { formatDate, getYear } from '@/lib/date'

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

/** Watch/play icon SVG component for video links */
function WatchIcon() {
    return (
        <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    )
}

/**
 * Music note icon SVG component for setlist links.
 * @param className - Optional Tailwind classes for sizing and styling
 */
function MusicIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
        </svg>
    )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Placeholder component displayed when a country flag cannot be resolved */
function UnknownFlag() {
    return (
        <span className="w-5 h-3.5 rounded-sm bg-gray-700 shrink-0 inline-flex items-center justify-center">
            <svg
                className="w-2.5 h-2.5 text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                    strokeWidth={2}
                />
                <path
                    strokeLinecap="round"
                    strokeWidth={2}
                    d="M12 3c-3 4-3 14 0 18M12 3c3 4 3 14 0 18M3 12h18"
                />
            </svg>
        </span>
    )
}

/**
 * Default placeholder thumbnail shown before actual thumbnail loads or if no thumbnail is available.
 * Displays a generic video icon.
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                />
            </svg>
        </div>
    )
}

// ── ShowCard ──────────────────────────────────────────────────────────────────

/**
 * Individual show card component displaying concert details, thumbnail, setlist, and links.
 * Lazily loads thumbnails when card becomes visible using Intersection Observer.
 * @param show - Show data to display
 * @returns JSX.Element
 */
export default function ShowCard({ show }: { show: Show }) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [setlistOpen, setSetlistOpen] = useState(false)
    const [thumbStatus, setThumbStatus] = useState<'error' | 'resolved' | undefined>()
    const [thumbnail, setThumbnail] = useState<string | null>(null)

    const year = getYear(show.Date)
    const songs = show.Setlist.split('\n')
        .map(s => s.trim())
        .filter(Boolean)
    const flagSrc = flagUrl(show.Country)

    useEffect(() => {
        if (!show.Link) return

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    fetch(`/api/thumbnail?url=${encodeURIComponent(show.Link)}`)
                        .then(r => r.json())
                        .then(data => setThumbnail(data.thumbnail))
                        .catch(() => {})
                    observer.disconnect()
                }
            },
            { rootMargin: '100px' },
        )

        if (cardRef.current) observer.observe(cardRef.current)

        return () => observer.disconnect()
    }, [show.Link])

    const badges = BADGES.filter(b => show[b.key] === 'Yes')

    const links: { href: string; cls: string; icon: ReactNode; label: string }[] = []
    if (show.Link)
        links.push({
            href: show.Link,
            cls: 'text-red-400 hover:text-red-300',
            icon: <WatchIcon />,
            label: 'Watch',
        })
    if (show['Setlist.fm'])
        links.push({
            href: show['Setlist.fm'],
            cls: 'text-lime-500 hover:text-lime-400',
            icon: <MusicIcon />,
            label: 'Setlist.fm',
        })

    return (
        <article
            ref={cardRef}
            className="show-card bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col"
        >
            <div className="h-36 overflow-hidden bg-gray-900 border-b border-gray-800 shrink-0">
                {show.Link ? (
                    <a
                        href={show.Link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-full group relative"
                    >
                        <DefaultThumbnail />
                        {thumbnail && thumbStatus !== 'error' && (
                            <img
                                src={thumbnail}
                                alt={`${show.City || show.Country || 'Live show'} – ${year ?? ''}`}
                                className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300 text-transparent${thumbStatus === 'resolved' ? '' : ' opacity-0'}`}
                                loading="lazy"
                                onLoad={e => {
                                    // YouTube serves a 120×90 placeholder with HTTP 200 for unavailable videos
                                    if (e.currentTarget.naturalWidth <= 120) {
                                        setThumbStatus('error')
                                    } else {
                                        setThumbStatus('resolved')
                                    }
                                }}
                                onError={() => setThumbStatus('error')}
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
                            <img
                                src={flagSrc}
                                alt={show.Country}
                                className="w-5 h-3.5 rounded-sm object-cover shadow-sm shrink-0 text-transparent"
                                loading="lazy"
                            />
                        ) : (
                            <UnknownFlag />
                        )}
                        <h3 className="font-semibold text-gray-100 leading-snug flex-1 min-w-0 truncate">
                            {show.City || show.Country || 'Unknown'}
                        </h3>
                        {year && (
                            <span className="text-xs font-bold text-brand-500 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full shrink-0">
                                {year}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-gray-500">{show.Country || 'Unknown'}</span>
                        <span className="text-gray-700 text-xs">·</span>
                        <span className="text-xs text-gray-500">{formatDate(show.Date)}</span>
                    </div>
                </div>

                {/* Badges */}
                {badges.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {badges.map(({ label, cls }) => (
                            <span
                                key={label}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                )}

                {/* Comment */}
                {show.Comment && <p className="text-xs text-yellow-700/80 italic leading-relaxed">{show.Comment}</p>}
            </div>

            {/* Setlist */}
            {songs.length > 0 && (
                <div className="border-t border-gray-800 px-4 pt-3 pb-1">
                    <button
                        className="w-full flex items-center justify-between gap-2 text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors py-1"
                        onClick={() => setSetlistOpen(o => !o)}
                    >
                        <span className="flex items-center gap-1.5">
                            <MusicIcon className="w-3.5 h-3.5 text-gray-600" />
                            Setlist
                            <span className="text-gray-600 font-normal">({songs.length} songs)</span>
                        </span>
                        <svg
                            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${setlistOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>
                    <div
                        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${setlistOpen ? 'max-h-[1200px]' : 'max-h-0'}`}
                    >
                        <ol className="pb-3 space-y-0.5 pt-1">
                            {songs.map((s, i) => (
                                <li
                                    key={i}
                                    className="flex gap-2 text-xs leading-relaxed"
                                >
                                    <span className="text-gray-700 w-5 shrink-0 text-right tabular-nums select-none">{i + 1}</span>
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
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${cls}`}
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
