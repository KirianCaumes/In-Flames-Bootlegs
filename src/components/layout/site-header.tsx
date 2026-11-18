'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
// eslint-disable-next-line no-restricted-imports
import IconSvg from '../../../public/favicon.svg'

// ── SiteHeader ────────────────────────────────────────────────────────────────

/** How many entries each section holds, shown next to its tab. */
interface SectionCounts {
    /** Entries in the live shows archive. */
    readonly shows: number
    /** Entries in the miscellaneous performances section. */
    readonly performances: number
}

/** Sections reachable from the header. Keep in sync with the app routes. */
const TABS: Array<{
    /** Route the tab points to. */
    href: string
    /** Tab label. */
    label: string
    /** Which count to show next to the label. */
    countKey: keyof SectionCounts
}> = [
    { href: '/', label: 'Live shows', countKey: 'shows' },
    { href: '/miscellaneous', label: 'Miscellaneous', countKey: 'performances' },
]

/**
 * Site chrome shared by every page, on one wrapping row: the signature, the section tabs with their counts,
 * and the switcher to the sibling In Flames Closet site.
 * The tabs are deliberately not the segmented control used by the grid/timeline toggle:
 * that idiom switches a view, while these navigate between pages.
 * @returns JSX.Element
 */
export default function SiteHeader({
    counts,
}: {
    /** Number of entries in each section. */
    readonly counts: SectionCounts
}) {
    const pathname = usePathname()

    return (
        <header className="border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-7 gap-y-1">
                {/* Every page carries its own <h1> in its hero, so the signature is plain text. */}
                <Link
                    className="inline-flex items-center gap-2.5 min-h-11"
                    href="/"
                >
                    <Image
                        alt=""
                        className="w-9 h-9 shrink-0"
                        src={IconSvg as string}
                    />
                    <span className="font-display font-semibold text-[21px] text-gray-100">
                        In Flames <span className="text-brand-500">Bootlegs</span>
                    </span>
                </Link>

                <nav
                    aria-label="Archive sections"
                    className="flex gap-5"
                >
                    {TABS.map(({ href, label, countKey }) => {
                        const isActive = pathname === href
                        return (
                            <Link
                                aria-current={isActive ? 'page' : undefined}
                                // eslint-disable-next-line max-len
                                className={`inline-flex items-center gap-2 min-h-11 transition-colors ${isActive ? 'font-medium text-gray-100 shadow-[inset_0_-2px_0_var(--color-brand-500)]' : 'text-gray-400 hover:text-gray-100'}`}
                                href={href}
                                key={href}
                            >
                                {label}
                                <span className="text-xs font-normal tabular-nums text-gray-400">{counts[countKey]}</span>
                            </Link>
                        )
                    })}
                </nav>

                <nav
                    aria-label="In Flames archives"
                    className="sm:ml-auto flex border border-gray-800 rounded-lg overflow-hidden"
                >
                    <a
                        className="inline-flex items-center gap-2 min-h-11 px-3.5 text-gray-400 hover:text-gray-100 transition-colors"
                        href="https://in-flames-closet.kiriancaumes.fr"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#f27700]" />
                        Closet
                    </a>
                    <Link
                        aria-current="page"
                        className="inline-flex items-center gap-2 min-h-11 px-3.5 bg-gray-800 font-medium text-gray-100"
                        href="/"
                    >
                        <span className="w-2 h-2 rounded-full bg-brand-500" />
                        Bootlegs
                    </Link>
                </nav>
            </div>
        </header>
    )
}
