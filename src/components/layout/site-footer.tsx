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
                        href={`mailto:ajesterscollection@gmail.com?subject=${encodeURIComponent('Dead link - In Flames Archive')}`}
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                // eslint-disable-next-line max-len
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                            />
                        </svg>
                        Signal a dead link
                    </a>
                    <a
                        // eslint-disable-next-line max-len
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 border border-gray-800 hover:border-brand-500/40 hover:text-brand-500 transition-colors"
                        href={`mailto:ajesterscollection@gmail.com?subject=${encodeURIComponent('New show suggestion - In Flames Archive')}`}
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
