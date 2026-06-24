// eslint-disable-next-line camelcase
import { Oswald, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import GdprBanner from 'components/gdpr-banner'
import type { Metadata } from 'next'
// eslint-disable-next-line no-restricted-imports
import './globals.css'

const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-plex-sans', display: 'swap' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-mono', display: 'swap' })
const oswald = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-oswald', display: 'swap' })

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
    title: 'In Flames - Bootlegs & Live Shows Archive',
    metadataBase: new URL('https://in-flames-bootlegs.kiriancaumes.fr'),
    description:
        // eslint-disable-next-line max-len
        'The most complete community archive of In Flames bootlegs and live recordings. Discover 200+ live shows from their 1994 Gothenburg roots all the way to today.',
    keywords: ['In Flames', 'bootleg', 'live show', 'concert', 'recording', 'archive', 'setlist', 'live recording'],
    authors: [{ name: "A Jester's Collection", url: 'https://jesterscollection.kiriancaumes.fr/' }],
    creator: "A Jester's Collection",
    robots: { index: true, follow: true },
    openGraph: {
        type: 'website',
        title: 'In Flames - Bootlegs & Live Shows Archive',
        description:
            // eslint-disable-next-line max-len
            'The most complete community archive of In Flames bootlegs and live recordings. Discover 200+ live shows from their 1994 Gothenburg roots all the way to today.',
        images: [{ url: '/favicon.png', width: 313, height: 313, alt: 'In Flames' }],
    },
    twitter: {
        card: 'summary',
        title: 'In Flames - Bootlegs & Live Shows Archive',
        description:
            // eslint-disable-next-line max-len
            'The most complete community archive of In Flames bootlegs and live recordings. Discover 200+ live shows from their 1994 Gothenburg roots all the way to today.',
        images: ['/favicon.png'],
    },
    icons: {
        icon: '/favicon.svg',
        shortcut: '/favicon.svg',
    },
}

/**
 * Root layout component that wraps all pages in the application. Sets global styles and metadata.
 * @returns JSX element representing the root layout of the application
 */
export default function RootLayout({
    children,
}: {
    /** React nodes to be rendered within the layout */
    readonly children: React.ReactNode
}) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
        >
            <body
                className={`${plexSans.variable} ${plexMono.variable} ${oswald.variable} font-sans bg-gray-950 text-gray-100 min-h-screen`}
            >
                {children}
                <GdprBanner />
            </body>
        </html>
    )
}
