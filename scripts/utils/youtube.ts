/**
 * YouTube helpers shared by the cron scripts.
 */

/** YouTube video id in any text: watch, youtu.be, live, shorts, embed, v and youtube-nocookie links. */
export const YOUTUBE_VIDEO_ID =
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^\s"'<>]*?&)?v=|live\/|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/gi

/** YouTube API list response subset. */
export interface YoutubeList<T> {
    /** Resources found: deleted and private ones are missing. */
    readonly items: Array<T>
    /** Token of the next page, when any. */
    readonly nextPageToken?: string
}

/** YouTube video, as returned by the videos endpoint. */
export interface YoutubeVideo {
    /** Video id. */
    readonly id: string
    /** Video snippet. */
    readonly snippet: {
        /** Title. */
        readonly title: string
        /** Description. */
        readonly description: string
        /** Channel name. */
        readonly channelTitle: string
        /** ISO publication date. */
        readonly publishedAt: string
        /** Category id. */
        readonly categoryId: string
    }
    /** Video details. */
    readonly contentDetails: {
        /** ISO 8601 duration, such as PT1H2M3S or P1DT2H. */
        readonly duration: string
    }
}

/** YouTube search result subset. */
export interface YoutubeSearchResult {
    /** Result id. */
    readonly id: {
        /** Video id. */
        readonly videoId: string
    }
}

/** YouTube playlist item, as returned by the playlistItems endpoint. */
export interface YoutubePlaylistItem {
    /** Item details. */
    readonly contentDetails: {
        /** Video id. */
        readonly videoId: string
    }
}

/**
 * Get the video a YouTube link opens.
 * @param link - Link to parse.
 * @returns Video id, or null when the link opens no video.
 */
export function getYoutubeVideoId(link: string): string | null {
    return new RegExp(YOUTUBE_VIDEO_ID.source, 'i').exec(link)?.[1] ?? null
}

/**
 * Get the playlist a YouTube link opens.
 * @param link - Link to parse.
 * @returns Playlist id, or null when the link opens no playlist.
 */
export function getYoutubePlaylistId(link: string): string | null {
    const url = URL.parse(link)
    return url && /(^|\.)youtube\.com$/i.test(url.hostname) ? url.searchParams.get('list') : null
}

/**
 * Call the YouTube Data API with the GOOGLE_API_KEY.
 * @param path - Endpoint, such as `videos`.
 * @param params - Query parameters.
 * @returns Parsed response, empty for a missing or private playlist.
 */
export async function youtube<T>(path: string, params: Record<string, string>): Promise<YoutubeList<T>> {
    const query = new URLSearchParams({ ...params, key: process.env.GOOGLE_API_KEY ?? '' })
    const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${query.toString()}`)
    if (!response.ok) {
        const error = await response.text()
        // Checked by reason: a 403 is also what an exhausted quota answers.
        if (/playlistNotFound|playlistItemsNotAccessible/.test(error)) {
            return { items: [] }
        }

        throw new Error(`YouTube ${path} failed: HTTP ${response.status} ${error}`)
    }

    return (await response.json()) as YoutubeList<T>
}

/**
 * Fetch videos, 50 per call.
 * @param ids - Video ids.
 * @param part - Parts to fetch, such as `id` or `snippet,contentDetails`.
 * @returns Videos found: deleted and private ones are missing.
 */
export async function getYoutubeVideos<T>(ids: Array<string>, part: string): Promise<Array<T>> {
    const batches = Array.from({ length: Math.ceil(ids.length / 50) }, (_, index) => ids.slice(index * 50, index * 50 + 50))
    const pages = await Promise.all(batches.map(batch => youtube<T>('videos', { part, id: batch.join(',') })))
    return pages.flatMap(page => page.items)
}
