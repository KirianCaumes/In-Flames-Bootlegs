'use client'

import { useState } from 'react'
import { MediaLinks, MusicIcon, WatchIcon, type MediaLink } from 'components/shared/media'
import { trackBootlegClick } from 'lib/archive/analytics'
import type { ArchiveShow } from 'lib/archive/shows'

/**
 * Collapsible setlist for a show.
 * @returns JSX.Element or null when the show has no songs.
 */
export function Setlist({
    songs,
}: {
    /** Songs in the setlist. */
    readonly songs: Array<string>
}) {
    const [isOpen, setIsOpen] = useState(false)
    if (songs.length === 0) {
        return null
    }
    return (
        <div className="border-t border-gray-800 px-4 pt-1 pb-1">
            <button
                // eslint-disable-next-line max-len
                className="w-full flex items-center justify-between gap-2 text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors py-1 cursor-pointer"
                onClick={() => {
                    setIsOpen(o => !o)
                }}
                type="button"
            >
                <span className="flex items-center gap-1.5">
                    <MusicIcon className="w-3.5 h-3.5 text-gray-400" />
                    Setlist
                    <span className="text-gray-400 font-normal">({songs.length} songs)</span>
                </span>
                <svg
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
            <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isOpen ? 'max-h-[1200px]' : 'max-h-0'}`}>
                <ol className="pb-1 space-y-0.5 pt-1">
                    {songs.map((s, i) => (
                        <li
                            className="flex gap-2 text-xs leading-relaxed"
                            // eslint-disable-next-line react/no-array-index-key
                            key={i}
                        >
                            <span className="text-gray-500 w-5 shrink-0 text-right font-mono tabular-nums select-none">{i + 1}.</span>
                            <span className="text-gray-400">{s}</span>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    )
}

/**
 * Renders the external links (Watch, Setlist.fm) available for a show.
 * @returns JSX.Element or null when the show has no links.
 */
export function ShowLinks({
    show,
    className = '',
}: {
    /** Show whose links to render. */
    readonly show: ArchiveShow
    /** Extra container classes. */
    readonly className?: string
}) {
    const links: Array<MediaLink> = [
        show.mediaLink
            ? {
                  href: show.mediaLink,
                  cls: 'text-red-400 hover:text-red-300',
                  icon: <WatchIcon />,
                  label: 'Watch',
                  onClick: () => {
                      trackBootlegClick({ show, source: 'footer' })
                  },
              }
            : null,
        show.setlistFmLink
            ? {
                  href: show.setlistFmLink,
                  cls: 'text-lime-500 hover:text-lime-400',
                  icon: <MusicIcon />,
                  label: 'Setlist.fm',
              }
            : null,
    ].filter(x => !!x)

    return (
        <MediaLinks
            className={className}
            links={links}
        />
    )
}
