import {
    buildMiscThumbnailPath,
    getMiscPerformanceDateDisplay,
    getMiscPerformanceImageAlt,
    type MiscPerformance,
} from 'lib/miscellaneous/performances'
import { BAND_ID, buildBandNode, buildWebsiteNode, MISCELLANEOUS_DESCRIPTION, SITE_URL, WEBSITE_ID } from 'lib/seo/graph'
import { toIsoDate } from 'lib/sheet-date'

const PAGE_URL = `${SITE_URL}/miscellaneous`

/**
 * Compose a human-readable description for a performance's MusicEvent node.
 * @param performance - Performance to describe.
 * @returns A concise sentence describing the performance.
 */
function buildEventDescription(performance: MiscPerformance): string {
    const songs = performance.songs.join(' / ')
    let main = songs ? `${songs} performed live` : 'Live performance'
    if (performance.event) {
        main += ` at ${performance.event}`
    }
    if (performance.date) {
        main += ` on ${getMiscPerformanceDateDisplay(performance)}`
    }

    return [`${main}.`, performance.comment].filter(Boolean).join(' ')
}

/**
 * Build the MusicEvent node for a single miscellaneous performance.
 * The band is linked through `about` rather than `performer`: a few entries are other bands covering
 * In Flames or hosting an In Flames member as a guest, so naming In Flames as the performer would be wrong.
 * @param performance - Performance to describe.
 * @returns The schema.org MusicEvent object.
 */
function buildMusicEvent(performance: MiscPerformance) {
    const isoDate = toIsoDate(performance.date)

    return {
        '@type': 'MusicEvent',
        '@id': `${PAGE_URL}#${performance.id}`,
        name: performance.title || getMiscPerformanceImageAlt(performance),
        description: buildEventDescription(performance),
        // A one-off performance spans a single day, so the start and end dates match.
        ...(isoDate ? { startDate: isoDate, endDate: isoDate } : {}),
        // The performance took place inside a wider event (ceremony, festival, radio show).
        ...(performance.event ? { superEvent: { '@type': 'Event', name: performance.event } } : {}),
        about: { '@id': BAND_ID },
        ...(performance.songs.length > 0
            ? { workPerformed: performance.songs.map(song => ({ '@type': 'MusicComposition', name: song })) }
            : {}),
        ...(performance.mediaLink
            ? {
                  image: `${SITE_URL}${encodeURI(buildMiscThumbnailPath(performance))}`,
                  url: performance.mediaLink,
              }
            : {}),
        eventStatus: 'https://schema.org/EventScheduled',
    }
}

/**
 * Build the JSON-LD graph describing the miscellaneous performances: the website, the band,
 * and a collection page listing every documented one-off performance.
 * @param performances - Performances currently listed.
 * @returns The schema.org graph object.
 */
function buildGraph(performances: Array<MiscPerformance>) {
    const collectionPage = {
        '@type': 'CollectionPage',
        '@id': `${PAGE_URL}#collection`,
        url: PAGE_URL,
        name: 'In Flames Miscellaneous Performances',
        description: MISCELLANEOUS_DESCRIPTION,
        inLanguage: 'en',
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': BAND_ID },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: performances.length,
            itemListElement: performances.map((performance, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: buildMusicEvent(performance),
            })),
        },
    }

    return {
        '@context': 'https://schema.org',
        '@graph': [buildWebsiteNode(), buildBandNode(), collectionPage],
    }
}

/**
 * Render the miscellaneous performances' JSON-LD structured data as a script tag for search and answer engines.
 * @returns The structured-data script element.
 */
export default function MiscStructuredData({
    performances,
}: {
    /** Performances currently listed. */
    readonly performances: Array<MiscPerformance>
}) {
    const json = JSON.stringify(buildGraph(performances)).replace(/</g, '\\u003c')
    return (
        <script
            // The graph is built from trusted, escaped data; this is the standard way to embed JSON-LD.
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: json }}
            type="application/ld+json"
        />
    )
}
