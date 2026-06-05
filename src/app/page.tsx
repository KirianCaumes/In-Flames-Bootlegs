import { headers } from 'next/headers'
import ArchivePage from 'components/archive/archive-page'
import { fetchArchiveShows } from 'lib/archive/shows'

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
    const ua = (await headers()).get('user-agent') ?? ''
    const device = /mobile|android|iphone|ipad|ipod/i.test(ua) ? 'mobile' : 'desktop'

    return (
        <ArchivePage
            device={device}
            shows={shows}
        />
    )
}
