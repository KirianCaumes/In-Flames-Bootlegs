import ArchivePage from 'components/archive/archive-page'
import SiteFooter from 'components/layout/site-footer'
import SiteHeader from 'components/layout/site-header'
import StructuredData from 'components/structured-data'
import { fetchArchiveShows } from 'lib/archive/fetch-shows'
import { fetchMiscPerformances } from 'lib/miscellaneous/fetch-performances'

// eslint-disable-next-line react-refresh/only-export-components
export const dynamic = 'force-dynamic'

/**
 * Root page of the In-Flames bootleg archive.
 * Server component that fetches shows from the Google Sheet and renders the archive page.
 * @returns Promise<JSX.Element>
 */
export default async function Page() {
    // The section tabs show both counts, so the miscellaneous sheet is read here too. Both reads share the same hourly cache.
    const [shows, performances] = await Promise.all([
        fetchArchiveShows().catch((error: unknown) => {
            // eslint-disable-next-line no-console
            console.error('Error fetching archive shows:', error)
            return [] as Awaited<ReturnType<typeof fetchArchiveShows>>
        }),
        fetchMiscPerformances().catch((error: unknown) => {
            // eslint-disable-next-line no-console
            console.error('Error fetching miscellaneous performances:', error)
            return [] as Awaited<ReturnType<typeof fetchMiscPerformances>>
        }),
    ])

    return (
        <>
            <StructuredData shows={shows} />
            <SiteHeader counts={{ shows: shows.length, performances: performances.length }} />
            <ArchivePage shows={shows} />
            <SiteFooter />
        </>
    )
}
