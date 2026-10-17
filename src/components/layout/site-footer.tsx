import { buildContactMailto } from 'lib/contact'

// ── SiteFooter ────────────────────────────────────────────────────────────────

/**
 * Site footer shared by every page: contribution links, disclaimer, and curator credit.
 * @returns JSX.Element
 */
export default function SiteFooter() {
    return (
        <footer className="border-t border-gray-800/50 mt-12 py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-4">
                <nav
                    aria-label="Archive actions"
                    className="flex flex-wrap justify-center gap-3"
                >
                    <a
                        // eslint-disable-next-line max-len
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 border border-gray-800 hover:border-brand-500/40 hover:text-brand-500 transition-colors"
                        href={buildContactMailto('Issue report')}
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                            />
                        </svg>
                        Report an issue
                    </a>
                    <a
                        // eslint-disable-next-line max-len
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 border border-gray-800 hover:border-brand-500/40 hover:text-brand-500 transition-colors"
                        href={buildContactMailto('New show suggestion')}
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                d="M12 4v16m8-8H4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                            />
                        </svg>
                        Suggest a new show
                    </a>
                </nav>
                <p className="text-gray-400 text-xs">
                    Non-commercial fan archive. All recordings and trademarks belong to their respective owners.
                </p>
                <a
                    className="text-xs text-brand-400 hover:text-brand-400 transition-colors"
                    href="https://jesterscollection.kiriancaumes.fr"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    jesterscollection.kiriancaumes.fr
                </a>
            </div>
        </footer>
    )
}
