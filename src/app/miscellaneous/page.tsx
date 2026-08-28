import SiteFooter from 'components/layout/site-footer'
import SiteHeader from 'components/layout/site-header'
import MiscStructuredData from 'components/miscellaneous/structured-data'
import PerformanceCard from 'components/miscellaneous/performance-card'
import { fetchArchiveShows } from 'lib/archive/fetch-shows'
import { fetchMiscPerformances } from 'lib/miscellaneous/fetch-performances'
import { MISCELLANEOUS_DESCRIPTION } from 'lib/seo/graph'
import type { Metadata } from 'next'

// eslint-disable-next-line react-refresh/only-export-components
export const dynamic = 'force-dynamic'

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
    title: 'In Flames - Miscellaneous Performances',
    description: MISCELLANEOUS_DESCRIPTION,
    keywords: ['In Flames', 'acoustic', 'award ceremony', 'guest appearance', 'feat', 'live performance', 'radio session'],
    alternates: { canonical: '/miscellaneous' },
    openGraph: {
        type: 'website',
        title: 'In Flames - Miscellaneous Performances',
        description: MISCELLANEOUS_DESCRIPTION,
        url: '/miscellaneous',
        siteName: 'In Flames Bootlegs Archive',
        images: [
            {
                url: '/favicon.png',
                width: 512,
                height: 512,
                alt: 'In Flames Bootlegs & Live Shows Archive',
            },
        ],
    },
    twitter: {
        card: 'summary',
        title: 'In Flames - Miscellaneous Performances',
        description: MISCELLANEOUS_DESCRIPTION,
        images: ['/favicon.png'],
    },
}

/**
 * Miscellaneous performances page: one-off appearances that are not full concerts.
 * Server component that fetches the "Various" sheet and renders it as a static grid, without filters.
 * @returns Promise<JSX.Element>
 */
export default async function MiscellaneousPage() {
    // The section tabs show both counts, so the archive sheet is read here too. Both reads share the same hourly cache.
    const [performances, shows] = await Promise.all([
        fetchMiscPerformances().catch((error: unknown) => {
            // eslint-disable-next-line no-console
            console.error('Error fetching miscellaneous performances:', error)
            return [] as Awaited<ReturnType<typeof fetchMiscPerformances>>
        }),
        fetchArchiveShows().catch((error: unknown) => {
            // eslint-disable-next-line no-console
            console.error('Error fetching archive shows:', error)
            return [] as Awaited<ReturnType<typeof fetchArchiveShows>>
        }),
    ])

    return (
        <>
            <MiscStructuredData performances={performances} />
            <SiteHeader counts={{ shows: shows.length, performances: performances.length }} />
            <main
                className="max-w-7xl mx-auto px-4 sm:px-6 py-6"
                id="main-content"
                tabIndex={-1}
            >
                <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-wide uppercase text-gray-100">
                    Miscellaneous performances
                </h1>
                <p className="mt-2 mb-6 text-sm text-gray-400">{MISCELLANEOUS_DESCRIPTION}</p>

                {performances.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                        <svg
                            className="w-12 h-12 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                // eslint-disable-next-line max-len
                                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                            />
                        </svg>
                        <p className="text-gray-400 font-medium">No performance listed yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {performances.map((performance, i) => (
                            <PerformanceCard
                                key={performance.id}
                                performance={performance}
                                priority={i === 0}
                            />
                        ))}
                    </div>
                )}
            </main>
            <SiteFooter />
        </>
    )
}
