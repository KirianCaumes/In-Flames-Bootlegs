/**
 * New bootlegs finder, meant to be run by a cron: `npm run find-bootlegs` (`-- --dry-run` to only print).
 * Inspired by In-Flames-Bootlegs-YT-Seeker.
 *
 * Searches YouTube for long "In Flames" videos of the last 30 days and of every past year, drops the ones already in the sheet
 * (cells, links, notes or comments) or in the database, scores the others and posts the likely live recordings on Discord.
 * Analyzed videos are then stored in the SQLite database, so each is posted once.
 */
import { mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { Effect, Schema } from 'effect'
import { COLORS, Discord, discordDate } from './utils/discord.ts'
import { Env } from './utils/env.ts'
import { google } from './utils/google.ts'
import { run } from './utils/run.ts'
import { getYoutubeVideos, youtube, YOUTUBE_VIDEO_ID, YoutubeSearchResult, YoutubeVideo } from './utils/youtube.ts'

/** Search terms: neither finds everything, so both run on every period. */
const QUERIES = ['"In Flames"', '"In Flames" live']

/** First year searched: YouTube capped uploads at 15 minutes until late 2010, and only long videos are searched. */
const FIRST_YEAR = 2010

/** Minimum score for a video to be posted. */
const MIN_SCORE = 4

/** Sheet tabs whose cells and notes may hold YouTube links. */
const SHEETS = ['Live show', 'Various']

/**
 * Build a regex matching whole words from a list. Unicode boundaries are used since `\b` only handles ASCII ("обзор", "épisode").
 * @param list - Alternatives, `|` separated.
 * @returns Case-insensitive regex.
 */
function words(list: string): RegExp {
    return new RegExp(`(?<![\\p{L}\\d])(${list})(?![\\p{L}\\d])`, 'iu')
}

/** "In Flames", also written "InFlames", "In-Flames" or with a non-breaking space. */
const IN_FLAMES = String.raw`in[\s_-]*flames`

/** Uploads that are never a live recording. */
const REJECT = words(
    'lyrics|interview|rig rundown|reacts?|reaction|documentary|making of|tier list|ranked|ranking|top \\d+|review|обзор|' +
        'podcast|drinks with|q&a|épisode|episode \\d|cover|tribute|practice|playthrough|lesson|tutorial|(guitar|drum)(?! ?cam)|' +
        'loop|slowed|collection|compilation|best moments|speedrun|progression|discography',
)

/** Uploads that are a live recording only with a live hint: "DVD rip", "soundboard mix", "full album live". */
const STUDIO = words('full album|full ep|album stream|official audio|vinyl|box ?set|rip|mix')

/** Other meanings of "in flames". */
const OFF_TOPIC = words(
    'war|guerre|ukraine|russia|gaza|israel|syria|military|army|soldiers?|battle|missiles?|drones?|bombing|ww2|nazi|' +
        'wildfire|fire department|incendie|explosion|riots?|news|breaking|ceasefire|' +
        'gameplay|walkthrough|minecraft|fortnite|gta|call of duty|warzone|total war|hearts of iron|' +
        'movie|drama|shortmax|asmr|sleep|audiobook|sermon|karaoke',
)

/** Album titles: without a concert hint, the upload is the studio album. */
const ALBUM = words(
    'lunar strain|subterranean|the jester race|whoracle|colony|clayman|reroute to remain|soundtrack to your escape|' +
        'come clarity|a sense of purpose|sounds of a playground fading|siren charms|battles|i, the mask|foregone',
)

/** Live hints. */
const LIVE = words('live|livestream|concert|konzert|концерт|koncert|gig|en vivo|ao vivo|na żywo|dvd|in live we trust')

/** Recording hints. */
const BOOTLEG = words(
    'bootleg|full show|full concert|full set|complete set|complete show|pro-?shot|audience|soundboard|multicam|' +
        '(drum|guitar|bass|fan) ?cam|broadcast|highlights',
)

/** Festivals In Flames played. Specific enough to be searched in descriptions too. */
const FESTIVAL_NAMES =
    'wacken|w:o:a|hellfest|graspop|bloodstock|summer breeze|rock am ring|rock im park|tuska|sweden rock|' +
    'resurrection fest|brutal assault|masters of rock|knotfest|ozzfest|with full force|metaldays|dynamo|gods of metal|' +
    'sonisphere|nova rock|rock in rio|copenhell|tons of rock|motocultor|party san|rockstad|sziget|mystic festival|' +
    'leyendas del rock|rock imperium|tolminator|rock on the range|carolina rebellion|northern invasion|rockfest'

/** Festival hints of a title: names, plus words too common in descriptions ("download here"). */
const FESTIVAL = words(`${FESTIVAL_NAMES}|download|resurrection|fest(ival)?`)

/** Festival names searched in descriptions. */
const FESTIVAL_IN_DESCRIPTION = words(FESTIVAL_NAMES)

/** Venue and tour hints. */
const VENUE = words('arena|hall|club|theat(re|er)|ballroom|academy|roundhouse|stadium|gymnasium|docks|hammersmith|bataclan|tour')

/** Month names, as whole words (see DATE) so "Denmark" or "Mayhem" are not months. */
const MONTH = String.raw`(?<!\p{L})(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|june?|july?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?|dec(ember)?)`

/** Dates such as 24/06/1994, 24th jun or June 24. */
const DATE = new RegExp(
    String.raw`\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{1,2}(st|nd|rd|th)?\s+${MONTH}(?!\p{L})|${MONTH}\.?\s+\d{1,2}(?!\d)`,
    'iu',
)

/** Years In Flames may have played. */
const YEAR = /(?<!\d)(199\d|20[0-3]\d)(?!\d)/

/** Title starting with "In Flames". */
const STARTS_WITH_IN_FLAMES = new RegExp(String.raw`^[^\p{L}\d]*${IN_FLAMES}(?![\p{L}\d])`, 'iu')

/** Word right before "In Flames", as in "World in flames" or "Hellfest In Flames". */
const WORD_BEFORE_IN_FLAMES = new RegExp(String.raw`(?<!\p{L})(\p{L}+)\s+${IN_FLAMES}(?![\p{L}\d])`, 'iu')

/** Words that may come right before "In Flames" in a concert title. */
const SEPARATOR = words('at|by|and|feat|with|vs|presents|w')

/** Points per YouTube category: Music, Gaming, News, Education. */
const CATEGORY: Partial<Record<string, number>> = { 10: 2, 20: -4, 25: -4, 27: -2 }

/** Drive comments page subset. */
const DriveCommentsPage = Schema.Struct({
    /** Comments, missing when there are none: only searched for YouTube links, so kept as is. */
    comments: Schema.optional(Schema.Array(Schema.Unknown)),
    /** Token of the next page, when any. */
    nextPageToken: Schema.optional(Schema.String),
})

/**
 * Get every YouTube id of the sheet: cells, links, notes, and comments with their replies.
 * @returns Video ids.
 */
const getSheetVideoIds = Effect.gen(function* () {
    const { GOOGLE_SHEET_ID } = yield* Env
    const sheetQuery = new URLSearchParams([
        ['includeGridData', 'true'],
        ['fields', 'sheets.data.rowData.values(formattedValue,hyperlink,note)'],
        ...SHEETS.map(sheet => ['ranges', sheet]),
    ])
    // Only searched for YouTube links, so kept as is.
    const sheet = yield* google(
        `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}?${sheetQuery.toString()}`,
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        Schema.Unknown,
    )
    const texts = [JSON.stringify(sheet)]

    for (let pageToken: string | undefined = ''; pageToken !== undefined; ) {
        const query = new URLSearchParams({ pageSize: '100', fields: 'nextPageToken,comments(content,replies(content))', pageToken })
        const page: typeof DriveCommentsPage.Type = yield* google(
            `https://www.googleapis.com/drive/v3/files/${GOOGLE_SHEET_ID}/comments?${query.toString()}`,
            'https://www.googleapis.com/auth/drive.readonly',
            DriveCommentsPage,
        )
        texts.push(JSON.stringify(page.comments ?? []))
        pageToken = page.nextPageToken
    }

    return new Set(texts.flatMap(text => [...text.matchAll(YOUTUBE_VIDEO_ID)].map(match => match[1])))
})

/**
 * Search long "In Flames" videos over the last 30 days and over each year since FIRST_YEAR, most relevant first.
 * Only the first page of 50 results is read: the next ones hold almost no live recordings. Results vary from one call to
 * the next, so each weekly run also brings back older videos that were missed. Each search costs 100 of the 10,000 daily quota units,
 * and counts toward the 100 searches a day allowed per project.
 * @returns Video ids.
 */
const searchVideoIds = Effect.gen(function* () {
    const now = new Date()
    const periods = [
        { publishedAfter: new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString() },
        ...Array.from({ length: now.getFullYear() - FIRST_YEAR + 1 }, (_, index) => ({
            publishedAfter: `${FIRST_YEAR + index}-01-01T00:00:00Z`,
            publishedBefore: `${FIRST_YEAR + index + 1}-01-01T00:00:00Z`,
        })),
    ]
    // Partitioned: a search refused by the quota (100 searches a day per project) must not lose the others.
    const [pages, failures] = yield* Effect.partition(
        periods.flatMap(period => QUERIES.map(q => ({ q, ...period }))),
        params => youtube('search', { part: 'id', type: 'video', videoDuration: 'long', maxResults: '50', ...params }, YoutubeSearchResult),
        { concurrency: 'unbounded' },
    )

    if (pages.length === 0) {
        return yield* Effect.fail(failures[0])
    }
    yield* Effect.forEach(failures, failure =>
        Effect.logWarning(`Search failed, its videos wait for the next run: ${failure.message.split('\n')[0]}`),
    )

    return new Set(pages.flatMap(page => page.items.map(item => item.id.videoId)))
})

/**
 * Score a video: the higher, the likelier an In Flames live recording.
 * "In flames" is a common phrase (wars, wildfires, TV shows...), so positive and negative hints add up.
 * @param snippet - Video snippet.
 * @param seconds - Video duration, in seconds.
 * @returns Score and the reason of each point.
 */
function scoreVideo(snippet: YoutubeVideo['snippet'], seconds: number): [number, Array<string>] {
    const { title, categoryId } = snippet
    const isLive = LIVE.test(title) || BOOTLEG.test(title)
    // A year alone does not make an album title a concert: "Colony [1999]" is the studio album.
    const hasStrongConcertHint = isLive || [FESTIVAL, VENUE, DATE].some(regex => regex.test(title))
    const hasConcertHint = hasStrongConcertHint || YEAR.test(title)
    const wordBefore = WORD_BEFORE_IN_FLAMES.exec(title)?.[1] ?? ''
    const reasons: Array<string> = []
    let score = 0

    /**
     * Add points when a regex matches, or a condition holds.
     * @param test - Regex to run, or condition.
     * @param points - Points to add.
     * @param reason - Why, completed with the matched text.
     * @param text - Text to run the regex on.
     */
    const add = (test: RegExp | boolean, points: number, reason: string, text = title): void => {
        const matched = typeof test === 'boolean' ? test : test.exec(text)?.[0]
        if (matched) {
            score += points
            reasons.push(`${points > 0 ? '+' : ''}${points} ${reason}${typeof matched === 'string' ? ` "${matched}"` : ''}`)
        }
    }

    add(!new RegExp(IN_FLAMES, 'iu').test(title), -100, 'no "In Flames" in title')
    add(REJECT, -100, 'off topic')
    add(!isLive && STUDIO, -100, 'studio upload')
    add(!hasConcertHint, -100, 'no concert hint')
    add(!hasStrongConcertHint && ALBUM, -100, 'studio album')
    add(STARTS_WITH_IN_FLAMES, 3, 'title starts with')
    // "World in flames" is a phrase, "Wacken In Flames" or "Konzert In Flames" a concert.
    add(
        !!wordBefore && ![SEPARATOR, LIVE, BOOTLEG, FESTIVAL, VENUE].some(regex => regex.test(wordBefore)),
        -5,
        `phrase "${wordBefore} In Flames"`,
    )
    add(OFF_TOPIC, -6, 'off topic')
    add(LIVE, 2, 'live')
    add(BOOTLEG, 3, 'recording')
    add(FESTIVAL, 2, 'festival')
    add(!FESTIVAL.test(title) && FESTIVAL_IN_DESCRIPTION, 2, 'festival in description', snippet.description)
    add(VENUE, 1, 'venue/tour')
    add(DATE, 1, 'date')
    add(YEAR, 1, 'year')
    add(!!CATEGORY[categoryId], CATEGORY[categoryId] ?? 0, `category ${categoryId}`)
    add(seconds >= 35 * 60 && seconds <= 3 * 3600, 1, 'concert length')

    return [score, reasons]
}

/**
 * Parse an ISO 8601 duration.
 * @param duration - Duration, such as PT1H2M3S or P1DT2H.
 * @returns Seconds.
 */
function parseDuration(duration: string): number {
    const [, days = 0, hours = 0, minutes = 0, seconds = 0] = /P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/.exec(duration) ?? []
    return ((Number(days) * 24 + Number(hours)) * 60 + Number(minutes)) * 60 + Number(seconds)
}

const program = Effect.gen(function* () {
    const discord = yield* Discord

    const db = yield* Effect.acquireRelease(
        Effect.sync(() => {
            // Mounted as a volume once deployed.
            mkdirSync('data', { recursive: true })
            const database = new DatabaseSync('data/bootlegs.sqlite')
            database.exec(`CREATE TABLE IF NOT EXISTS videos (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                score INTEGER NOT NULL,
                reasons TEXT NOT NULL,
                seen_at TEXT NOT NULL DEFAULT (datetime('now'))
            )`)
            return database
        }),
        database =>
            Effect.sync(() => {
                database.close()
            }),
    )
    const isKnown = db.prepare('SELECT 1 FROM videos WHERE id = ?')

    const [inSheet, found] = yield* Effect.all([getSheetVideoIds, searchVideoIds], { concurrency: 'unbounded' })
    const videos = yield* getYoutubeVideos(
        [...found].filter(id => !inSheet.has(id) && !isKnown.get(id)),
        'snippet,contentDetails',
        YoutubeVideo,
    )

    const scored = videos
        .map(video => {
            const seconds = parseDuration(video.contentDetails.duration)
            const [score, reasons] = scoreVideo(video.snippet, seconds)
            return { ...video, seconds, score, reasons: reasons.join(', ') }
        })
        .toSorted((a, b) => b.score - a.score)
    const candidates = scored.filter(video => video.score >= MIN_SCORE)

    yield* Effect.log(
        `${found.size} video(s) found, ${scored.length} new, ${candidates.length} candidate(s)\n${candidates
            .map(video => `  [${video.score}] ${video.snippet.title} - https://www.youtube.com/watch?v=${video.id} (${video.reasons})`)
            .join('\n')}`,
    )

    if (!process.argv.includes('--dry-run')) {
        // Discord first: if sending fails, nothing is stored and the videos are analyzed again on the next run.
        if (candidates.length > 0) {
            const now = new Date().toISOString()
            yield* discord.send(
                `**🔥 ${candidates.length} new bootleg${candidates.length > 1 ? 's' : ''}** found on YouTube`,
                candidates.map(video => ({
                    title: video.snippet.title,
                    url: `https://www.youtube.com/watch?v=${video.id}`,
                    color: COLORS.Bootleg,
                    fields: [
                        { name: '📺 Channel', value: video.snippet.channelTitle, inline: true },
                        { name: '⏱️ Duration', value: `${Math.round(video.seconds / 60)} min`, inline: true },
                        { name: '📅 Published', value: discordDate(new Date(video.snippet.publishedAt)), inline: true },
                    ],
                    thumbnail: { url: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg` },
                    footer: { text: 'In Flames Bootlegs' },
                    timestamp: now,
                })),
            )
        }

        // One transaction, and OR IGNORE so an overlapping run cannot fail the batch halfway.
        const insert = db.prepare('INSERT OR IGNORE INTO videos (id, title, score, reasons) VALUES (?, ?, ?, ?)')
        db.exec('BEGIN')
        scored.forEach(video => insert.run(video.id, video.snippet.title, video.score, video.reasons))
        db.exec('COMMIT')
    }
}).pipe(Effect.scoped)

await run(program)
