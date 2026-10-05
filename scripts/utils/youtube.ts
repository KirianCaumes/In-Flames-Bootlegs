/**
 * YouTube helpers shared by the cron scripts.
 */
import { Data, Effect, Schema } from 'effect'
import { Env } from './env.ts'

/** YouTube video id in any text: watch, youtu.be, live, shorts, embed, v and youtube-nocookie links. */
export const YOUTUBE_VIDEO_ID =
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^\s"'<>]*?&)?v=|live\/|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/gi

/**
 * Error while calling the YouTube Data API.
 */
export class YoutubeError extends Data.TaggedError('YoutubeError')<{
    /** Message. */
    message: string
}> {}

/** YouTube video id, as returned by the videos endpoint with the `id` part. */
export const YoutubeVideoId = Schema.Struct({
    /** Video id. */
    id: Schema.String,
})

/** YouTube video, as returned by the videos endpoint with the `snippet,contentDetails` parts. */
export const YoutubeVideo = Schema.Struct({
    /** Video id. */
    id: Schema.String,
    /** Video snippet. */
    snippet: Schema.Struct({
        /** Title. */
        title: Schema.String,
        /** Description. */
        description: Schema.String,
        /** Channel name. */
        channelTitle: Schema.String,
        /** ISO publication date. */
        publishedAt: Schema.String,
        /** Category id. */
        categoryId: Schema.String,
    }),
    /** Video details. */
    contentDetails: Schema.Struct({
        /** ISO 8601 duration, such as PT1H2M3S or P1DT2H. */
        duration: Schema.String,
    }),
})
export type YoutubeVideo = typeof YoutubeVideo.Type

/** YouTube search result subset. */
export const YoutubeSearchResult = Schema.Struct({
    /** Result id. */
    id: Schema.Struct({
        /** Video id. */
        videoId: Schema.String,
    }),
})

/** YouTube playlist item, as returned by the playlistItems endpoint. */
export const YoutubePlaylistItem = Schema.Struct({
    /** Item details. */
    contentDetails: Schema.Struct({
        /** Video id. */
        videoId: Schema.String,
    }),
})

/** YouTube API list response subset. */
interface YoutubeList<A> {
    /** Resources found: deleted and private ones are missing. */
    readonly items: ReadonlyArray<A>
    /** Token of the next page, when any. */
    readonly nextPageToken?: string
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
 * @param item - Schema of a resource.
 * @returns Decoded response, empty for a missing or private playlist.
 */
export const youtube = <A>(path: string, params: Record<string, string>, item: Schema.Decoder<A>) =>
    Effect.gen(function* () {
        const { GOOGLE_API_KEY } = yield* Env
        const query = new URLSearchParams({ ...params, key: GOOGLE_API_KEY })
        const res = yield* Effect.tryPromise({
            try: async () => {
                const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${query.toString()}`)
                return { ok: response.ok, status: response.status, text: await response.text() }
            },
            catch: cause => new YoutubeError({ message: `YouTube ${path} failed: ${String(cause)}` }),
        })
        if (!res.ok) {
            // Checked by reason: a 403 is also what an exhausted quota answers.
            if (/playlistNotFound|playlistItemsNotAccessible/.test(res.text)) {
                return { items: [] } satisfies YoutubeList<A>
            }

            return yield* Effect.fail(new YoutubeError({ message: `YouTube ${path} failed: HTTP ${res.status} ${res.text}` }))
        }

        const list: Schema.Decoder<YoutubeList<A>> = Schema.Struct({
            items: Schema.Array(item),
            nextPageToken: Schema.optional(Schema.String),
        })
        return yield* Schema.decodeUnknownEffect(Schema.fromJsonString(list))(res.text)
    })

/**
 * Fetch videos, 50 per call.
 * @param ids - Video ids.
 * @param part - Parts to fetch, such as `id` or `snippet,contentDetails`.
 * @param item - Schema of a video with these parts.
 * @returns Videos found: deleted and private ones are missing.
 */
export const getYoutubeVideos = <A>(ids: ReadonlyArray<string>, part: string, item: Schema.Decoder<A>) =>
    Effect.forEach(
        Array.from({ length: Math.ceil(ids.length / 50) }, (_, index) => ids.slice(index * 50, index * 50 + 50)),
        batch => youtube('videos', { part, id: batch.join(',') }, item),
        { concurrency: 'unbounded' },
    ).pipe(Effect.map(pages => pages.flatMap(page => page.items)))
