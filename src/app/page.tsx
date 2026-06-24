import ArchivePage from 'components/archive/archive-page'
import StructuredData from 'components/structured-data'
import { fetchArchiveShows } from 'lib/archive/shows'

// eslint-disable-next-line react-refresh/only-export-components
export const dynamic = 'force-dynamic'

/**
 * Root page of the In-Flames bootleg archive.
 * Server component that fetches shows from the Google Sheet and renders the archive page.
 * @returns Promise<JSX.Element>
 */
export default async function Page() {
    const shows = await fetchArchiveShows().catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching archive shows:', error)
        return [] as Awaited<ReturnType<typeof fetchArchiveShows>>
    })

    return (
        <>
            <StructuredData shows={shows} />
            <ArchivePage shows={shows} />
        </>
    )
}
