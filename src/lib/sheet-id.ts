/**
 * Prefix namespacing the ids of the `Live show` sheet.
 * Both prefixes live here rather than in their own module so that keeping them distinct is a local, visible decision:
 * `/thumbnail/[slug]` reads the prefix to know which sheet to resolve an id against.
 */
export const SHOW_ID_PREFIX = 's'

/** Prefix namespacing the ids of the `Various` sheet. Must stay distinct from {@link SHOW_ID_PREFIX}. */
export const MISC_ID_PREFIX = 'm'

/** FNV-1a 32-bit offset basis. */
const FNV_OFFSET_BASIS = 0x811c9dc5

/** FNV-1a 32-bit prime. */
const FNV_PRIME = 0x01000193

/**
 * Hash a media link into a short, URL-safe token, used as the stable id of a sheet row.
 * A row's identity comes from its link rather than from its date (two entries can share a date) or its row
 * number (which shifts on every insertion), so the id only ever changes when the link itself does.
 * FNV-1a is used rather than `node:crypto` so this module stays importable from client components.
 * @param mediaLink - Link to hash.
 * @returns Base-36 hash of the link.
 */
export function hashMediaLink(mediaLink: string): string {
    let hash = FNV_OFFSET_BASIS
    for (let index = 0; index < mediaLink.length; index += 1) {
        hash = Math.imul(hash ^ mediaLink.charCodeAt(index), FNV_PRIME)
    }

    return (hash >>> 0).toString(36)
}
