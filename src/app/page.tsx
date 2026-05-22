import { Suspense } from 'react'
import { headers } from 'next/headers'
import { fetchShows } from 'lib/shows'
import ArchivePage from 'components/ArchivePage'

/**
 * Root page of the In-Flames bootleg archive.
 * Server component that fetches shows from the Google Sheet and renders the archive page.
 * @returns Promise<JSX.Element>
 */
export default async function Page() {
    const shows = await fetchShows()
    const ua = (await headers()).get('user-agent') ?? ''
    const device = /mobile|android|iphone|ipad|ipod/i.test(ua) ? 'mobile' : 'desktop'

    return (
        <Suspense>
            <ArchivePage
                device={device}
                shows={shows}
            />
        </Suspense>
    )
}
