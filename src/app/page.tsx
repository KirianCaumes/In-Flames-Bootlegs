import { fetchShows } from 'lib/shows'
import ArchivePage from 'components/ArchivePage'

/**
 * Root page of the In-Flames bootleg archive.
 * Server component that fetches shows from the Google Sheet and renders the archive page.
 * @returns Promise<JSX.Element>
 */
export default async function Page() {
    const shows = await fetchShows()
    return <ArchivePage shows={shows} />
}
