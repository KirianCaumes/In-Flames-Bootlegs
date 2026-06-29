import {
    getArchiveShowDateDisplay,
    getArchiveShowIsoDate,
    getArchiveShowLocation,
    getArchiveShowVenue,
    type ArchiveShow,
} from 'lib/archive/shows'
import { buildShowThumbnailPath } from 'lib/archive/thumbnails'

const SITE_URL = 'https://in-flames-bootlegs.kiriancaumes.fr'
const WEBSITE_ID = `${SITE_URL}/#website`
const BAND_ID = `${SITE_URL}/#in-flames`

const ARCHIVE_DESCRIPTION =
    // eslint-disable-next-line max-len
    'The most complete community archive of In Flames bootlegs and live recordings. Discover 200+ live shows from their 1994 Swedish roots all the way to today.'

/**
 * Compose a human-readable description for a show's MusicEvent node.
 * @param show - Show to describe.
 * @param location - Pre-computed "City, Country" location label.
 * @returns A concise sentence describing the concert.
 */
function buildEventDescription(show: ArchiveShow, location: string): string {
    const venue = getArchiveShowVenue(show)
    let main = 'In Flames performing live'
    if (venue) {
        main += ` at ${venue}`
    }
    if (location !== 'Unknown location') {
        main += ` in ${location}`
    }
    if (show.date) {
        main += ` on ${getArchiveShowDateDisplay(show)}`
    }

    const extra: Array<string> = []
    if (show.tour) {
        extra.push(`Part of the ${show.tour} tour.`)
    }
    if (show.songs.length > 0) {
        extra.push(`${show.songs.length}-song setlist.`)
    }

    return [`${main}.`, ...extra].join(' ')
}

/**
 * Build the MusicEvent node for a single archived show, enriching it with the
 * optional fields search engines look for (description, image, address, dates).
 * @param show - Show to describe.
 * @returns The schema.org MusicEvent object.
 */
function buildMusicEvent(show: ArchiveShow) {
    const location = getArchiveShowLocation(show)
    const isoDate = getArchiveShowIsoDate(show)
    const address = {
        ...(show.city ? { addressLocality: show.city } : {}),
        ...(show.country ? { addressCountry: show.country } : {}),
    }
    const place = {
        '@type': 'Place',
        name: location,
        ...(Object.keys(address).length > 0 ? { address: { '@type': 'PostalAddress', ...address } } : {}),
    }

    return {
        '@type': 'MusicEvent',
        name: show.title || `In Flames - ${location}`,
        description: buildEventDescription(show, location),
        // A historical concert spans a single day, so the start and end dates match.
        ...(isoDate ? { startDate: isoDate, endDate: isoDate } : {}),
        location: place,
        performer: { '@id': BAND_ID },
        // Festivals are the closest thing to an organizer the archive knows about.
        ...(show.festival ? { organizer: { '@type': 'Organization', name: show.festival } } : {}),
        ...(show.mediaLink
            ? {
                  image: `${SITE_URL}${encodeURI(buildShowThumbnailPath(show, getArchiveShowDateDisplay(show)))}`,
                  url: show.mediaLink,
              }
            : {}),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    }
}

/**
 * Build the JSON-LD graph describing the archive: the website (with a search action),
 * the In Flames music group, and a collection page listing every documented show.
 * @param shows - Shows currently in the archive.
 * @returns The schema.org graph object.
 */
function buildGraph(shows: Array<ArchiveShow>) {
    const website = {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: `${SITE_URL}/`,
        name: 'In Flames Bootlegs & Live Shows Archive',
        description: ARCHIVE_DESCRIPTION,
        inLanguage: 'en',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_URL}/?song={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    }

    const band = {
        '@type': 'MusicGroup',
        '@id': BAND_ID,
        name: 'In Flames',
        genre: ['Melodic death metal', 'Alternative metal'],
        foundingDate: '1990',
        foundingLocation: { '@type': 'Place', name: 'Gothenburg, Sweden' },
        sameAs: ['https://en.wikipedia.org/wiki/In_Flames'],
    }

    const collectionPage = {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/#archive`,
        url: `${SITE_URL}/`,
        name: 'In Flames Bootlegs & Live Shows Archive',
        description: ARCHIVE_DESCRIPTION,
        inLanguage: 'en',
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': BAND_ID },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: shows.length,
            itemListElement: shows.map((show, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: buildMusicEvent(show),
            })),
        },
    }

    return {
        '@context': 'https://schema.org',
        '@graph': [website, band, collectionPage],
    }
}

/**
 * Render the archive's JSON-LD structured data as a script tag for search engines and answer engines.
 * @returns The structured-data script element.
 */
export default function StructuredData({
    shows,
}: {
    /** Shows currently in the archive. */
    readonly shows: Array<ArchiveShow>
}) {
    const json = JSON.stringify(buildGraph(shows)).replace(/</g, '\\u003c')
    return (
        <script
            // The graph is built from trusted, escaped data; this is the standard way to embed JSON-LD.
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: json }}
            type="application/ld+json"
        />
    )
}
