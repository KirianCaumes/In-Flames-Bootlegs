/**
 * Maps country names to their ISO 3166-1 alpha-2 country codes for flag display.
 * Used by the flag CDN to fetch and display country flag SVGs.
 */
const COUNTRY_FLAGS: Record<string, string> = {
    'United States': 'us',
    Germany: 'de',
    Sweden: 'se',
    Canada: 'ca',
    'United Kingdom': 'gb',
    England: 'gb',
    Finland: 'fi',
    France: 'fr',
    Austria: 'at',
    Spain: 'es',
    Norway: 'no',
    Australia: 'au',
    Switzerland: 'ch',
    Japan: 'jp',
    Belgium: 'be',
    Netherlands: 'nl',
    Italy: 'it',
    Mexico: 'mx',
    Czechia: 'cz',
    Russia: 'ru',
    'Russian Federation': 'ru',
    Denmark: 'dk',
    Poland: 'pl',
    Brazil: 'br',
    Hungary: 'hu',
    Slovenia: 'si',
    Luxembourg: 'lu',
    Argentina: 'ar',
    Chile: 'cl',
    Colombia: 'co',
    Romania: 'ro',
    Turkey: 'tr',
    Bulgaria: 'bg',
    China: 'cn',
    Greece: 'gr',
    Ukraine: 'ua',
    Belarus: 'by',
    'Costa Rica': 'cr',
    Estonia: 'ee',
    Croatia: 'hr',
    Indonesia: 'id',
    Ireland: 'ie',
    Portugal: 'pt',
    Singapore: 'sg',
    Slovakia: 'sk',
    'South Africa': 'za',
    'United Arab Emirates': 'ae',
    Ecuador: 'ec',
    India: 'in',
    Iceland: 'is',
    'South Korea': 'kr',
    Lithuania: 'lt',
    Latvia: 'lv',
    Peru: 'pe',
    'Puerto Rico': 'pr',
    Serbia: 'rs',
    Thailand: 'th',
    Taiwan: 'tw',
    Uruguay: 'uy',
}

/** CDN base URL for flag icons in 4x3 aspect ratio */
const FLAG_CDN = 'https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/'

/**
 * Generates a CDN URL for a country's flag icon.
 * @param country - Country name to look up
 * @returns Full URL to flag SVG or null if country is not recognized
 */
export function flagUrl(country: string): string | null {
    const code = COUNTRY_FLAGS[(country || '').trim()]
    return code ? `${FLAG_CDN}${code}.svg` : null
}
