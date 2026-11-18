import { buildContactMailto } from 'lib/contact'

// ── SiteFooter ────────────────────────────────────────────────────────────────

/**
 * Site footer shared by every page: disclaimer, contribution links and related sites.
 * @returns JSX.Element
 */
export default function SiteFooter() {
    const linkClassName = 'inline-flex items-center min-h-11 text-gray-100 hover:text-white transition-colors'

    return (
        <footer className="border-t border-gray-800 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 text-[13px] text-gray-400">
                <p>Non-commercial fan archive. All recordings and trademarks belong to their respective owners.</p>
                <nav
                    aria-label="Archive actions and related sites"
                    className="flex flex-wrap gap-x-5 gap-y-1"
                >
                    <a
                        className={linkClassName}
                        href={buildContactMailto('Issue report')}
                    >
                        Report an issue
                    </a>
                    <a
                        className={linkClassName}
                        href={buildContactMailto('New show suggestion')}
                    >
                        Suggest a new show
                    </a>
                    <a
                        className={linkClassName}
                        href="https://in-flames-closet.kiriancaumes.fr"
                    >
                        In Flames Closet
                    </a>
                    <a
                        className={linkClassName}
                        href="https://jesterscollection.kiriancaumes.fr"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        A Jester&apos;s Collection
                    </a>
                </nav>
            </div>
        </footer>
    )
}
