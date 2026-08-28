/** Canonical origin of the archive. */
export const SITE_URL = 'https://in-flames-bootlegs.kiriancaumes.fr'

/** Node id of the website, referenced by every page's `isPartOf`. */
export const WEBSITE_ID = `${SITE_URL}/#website`

/** Node id of the band, referenced by every performance node. */
export const BAND_ID = `${SITE_URL}/#in-flames`

/** Shared description of the archive, reused by metadata and structured data. */
export const ARCHIVE_DESCRIPTION =
    // eslint-disable-next-line max-len
    'The most complete community archive of In Flames bootlegs and live recordings. Discover 200+ live shows from their 1994 Swedish roots all the way to today.'

/** Shared description of the miscellaneous performances section, reused by metadata and structured data. */
export const MISCELLANEOUS_DESCRIPTION =
    'One-off In Flames performances outside regular concerts: award ceremonies, acoustic radio sessions, and guest features with other artists.'

/**
 * Build the WebSite node shared by every page of the archive.
 * @returns The schema.org WebSite object.
 */
export function buildWebsiteNode() {
    return {
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
}

/**
 * Build the MusicGroup node describing In Flames, shared by every page of the archive.
 * @returns The schema.org MusicGroup object.
 */
export function buildBandNode() {
    return {
        '@type': 'MusicGroup',
        '@id': BAND_ID,
        name: 'In Flames',
        genre: ['Melodic death metal', 'Alternative metal'],
        foundingDate: '1990',
        foundingLocation: { '@type': 'Place', name: 'Gothenburg, Sweden' },
        sameAs: ['https://en.wikipedia.org/wiki/In_Flames'],
    }
}
