import SiteFooter from 'components/layout/site-footer'
import SiteHeader from 'components/layout/site-header'
import MiscArchive from 'components/miscellaneous/misc-archive'
import MiscStructuredData from 'components/miscellaneous/structured-data'
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
 * Server component that fetches the "Various" sheet and hands it to the searchable list.
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
            <MiscArchive performances={performances} />
            <SiteFooter />
        </>
    )
}
