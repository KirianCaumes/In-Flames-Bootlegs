import { Inter } from 'next/font/google'
import GdprBanner from 'components/GdprBanner'
import type { Metadata } from 'next'
// eslint-disable-next-line no-restricted-imports
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
    title: 'In Flames - Bootlegs & Live Shows Archive',
    metadataBase: new URL('https://in-flames-bootlegs.kiriancaumes.fr'),
    description:
        // eslint-disable-next-line max-len
        'The most complete community archive of In Flames bootlegs and live recordings. Discover 200+ live shows from their 1994 Gothenburg roots all the way to today.',
    keywords: ['In Flames', 'bootleg', 'live show', 'concert', 'recording', 'archive', 'setlist', 'live recording'],
    authors: [{ name: "A Jester's Collection" }],
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
            <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
                {children}
                <GdprBanner />
            </body>
        </html>
    )
}
