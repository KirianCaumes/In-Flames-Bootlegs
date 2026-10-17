import SiteFooter from 'components/layout/site-footer'
import SiteHeader from 'components/layout/site-header'
import { fetchArchiveShows } from 'lib/archive/fetch-shows'
import { fetchMiscPerformances } from 'lib/miscellaneous/fetch-performances'

/**
 * Layout shared by the archive sections (live shows, miscellaneous).
 * The header and footer live here rather than in each page so they persist across section navigations:
 * a layout is not re-rendered when moving between its pages, so the logo and tabs no longer remount and flicker.
 * It reads both sheets for the tab counts; the pages read their own sheet again, through the same hourly cache.
 * @returns Promise<JSX.Element>
 */
export default async function SectionsLayout({
    children,
}: {
    /** The section page. */
    readonly children: React.ReactNode
}) {
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
            <SiteHeader counts={{ shows: shows.length, performances: performances.length }} />
            {children}
            <SiteFooter />
        </>
    )
}
