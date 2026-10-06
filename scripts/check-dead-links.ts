/**
 * Dead link checker, meant to be run by a cron: `npm run check-links` (`-- --dry-run` to only print).
 *
 * Checks the `Link` of every row, posts the dead ones on Discord, then prefixes their title with 💀 in the sheet.
 * 💀 rows are skipped, so a dead link is reported once. Removing the 💀 once it is restored puts it back under watch.
 */
import { Effect, Schema } from 'effect'
import { parseSheetDate } from '../src/lib/sheet-date.ts'
import { COLORS, Discord, discordDate } from './utils/discord.ts'
import { Env } from './utils/env.ts'
import { google } from './utils/google.ts'
import { run } from './utils/run.ts'
import { getYoutubePlaylistId, getYoutubeVideoId, getYoutubeVideos, youtube, YoutubePlaylistItem, YoutubeVideoId } from './utils/youtube.ts'

/** Sheet tabs to check. */
const SHEETS = ['Live show', 'Various']

/** Prefix marking a sheet row as deleted. Mirrors `DELETED_TITLE_PREFIX`, which cannot be imported without the `lib/*` path alias. */
const DELETED_TITLE_PREFIX = '💀'

/** OAuth2 scope to read and mark the rows. */
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

/** A sheet row with a link to check. */
interface SheetRow {
    /** Title cell, in A1 notation. */
    readonly cell: string
    /** Sheet tab. */
    readonly sheet: string
    /** 1-based sheet row. */
    readonly row: number
    /** Row title. */
    readonly title: string
    /** Row date, as written in the sheet. */
    readonly date: string
    /** Link to check. */
    readonly link: string
}

/** Sheets API batchGet response subset. */
const SheetValues = Schema.Struct({
    /** One range per requested tab, in order. */
    valueRanges: Schema.Array(
        Schema.Struct({
            /** Rows, missing for an empty tab. */
            values: Schema.optional(Schema.Array(Schema.Array(Schema.String))),
        }),
    ),
})

/**
 * Format a sheet date for Discord.
 * @param dateText - Sheet date, in DD/MM/YYYY.
 * @returns Discord timestamp, or the raw text when it is not a valid date.
 */
function formatDate(dateText: string): string {
    const date = parseSheetDate(dateText)
    // At noon UTC, so the reader sees the same day whatever its time zone.
    return date ? discordDate(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12))) : dateText || '-'
}

/**
 * Tell whether a link is dead.
 * YouTube goes through the Data API, since a watch page answers 200 even for a deleted video: a playlist is dead once all its videos are.
 * Anything else is dead on a 404 or 410 only, since 403, 5xx or a network error are often bot protection or transient.
 * @param link - Link to check.
 * @returns True when the link is dead.
 */
const isDead = (link: string) =>
    Effect.gen(function* () {
        const videoId = getYoutubeVideoId(link)
        if (videoId) {
            return (yield* getYoutubeVideos([videoId], 'id', YoutubeVideoId)).length === 0
        }

        const playlistId = getYoutubePlaylistId(link)
        if (playlistId) {
            // Page by page, stopping at the first page holding an alive video.
            let pageToken = ''
            do {
                const page = yield* youtube(
                    'playlistItems',
                    { part: 'contentDetails', playlistId, maxResults: '50', pageToken },
                    YoutubePlaylistItem,
                )
                const videos = yield* getYoutubeVideos(
                    page.items.map(item => item.contentDetails.videoId),
                    'id',
                    YoutubeVideoId,
                )
                if (videos.length > 0) {
                    return false
                }
                pageToken = page.nextPageToken ?? ''
            } while (pageToken)

            return true
        }

        return yield* Effect.tryPromise(async () => {
            const response = await fetch(link, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36' },
                signal: AbortSignal.timeout(20_000),
            })
            return response.status === 404 || response.status === 410
        }).pipe(Effect.catch(error => Effect.logWarning(`Could not check ${link}: ${String(error.cause)}`).pipe(Effect.as(false))))
    })

const program = Effect.gen(function* () {
    const { GOOGLE_SHEET_ID } = yield* Env
    const discord = yield* Discord
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values`
    const sheetLink = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/edit`

    const { valueRanges } = yield* google(
        `${sheetUrl}:batchGet?${new URLSearchParams(SHEETS.map(sheet => ['ranges', sheet])).toString()}`,
        SCOPE,
        SheetValues,
    )
    const rows = valueRanges.flatMap(({ values = [] }, sheetIndex): Array<SheetRow> => {
        const sheet = SHEETS[sheetIndex]
        const [headers = [], ...cells] = values
        const [titleColumn, linkColumn, dateColumn] = ['Title', 'Link', 'Date'].map(header => headers.indexOf(header))

        return cells.flatMap((row, index) => {
            const title = row[titleColumn] ?? ''
            const link = row[linkColumn]?.trim() ?? ''
            // + 2: rows are 1-based and the header row was taken out.
            const cell = `${sheet}!${String.fromCharCode(65 + titleColumn)}${index + 2}`
            return title && !title.startsWith(DELETED_TITLE_PREFIX) && URL.canParse(link)
                ? [{ cell, sheet, row: index + 2, title, date: row[dateColumn] ?? '', link }]
                : []
        })
    })

    const isRowDead = yield* Effect.forEach(rows, row => isDead(row.link), { concurrency: 'unbounded' })
    const deadRows = rows.filter((_, index) => isRowDead[index])
    yield* Effect.log(`${deadRows.length} dead link(s)\n${deadRows.map(row => `- ${row.cell} ${row.title}: ${row.link}`).join('\n')}`)

    if (deadRows.length > 0 && !process.argv.includes('--dry-run')) {
        const now = new Date().toISOString()
        // Discord first: if sending fails, the rows are not marked and get reported on the next run.
        yield* discord.send(
            `💀 ${deadRows.length} dead link${deadRows.length > 1 ? 's' : ''} found in the In Flames Bootlegs sheet, ` +
                `now marked with ${DELETED_TITLE_PREFIX}`,
            deadRows.map(row => ({
                title: row.title,
                url: row.link,
                author: { name: `${row.sheet}, row ${row.row}`, url: sheetLink },
                color: COLORS.Dead,
                fields: [
                    { name: '🌐 Site', value: new URL(row.link).hostname.replace(/^www\./, ''), inline: true },
                    { name: '📅 Date', value: formatDate(row.date), inline: true },
                ],
                footer: { text: 'In Flames Bootlegs' },
                timestamp: now,
            })),
        )

        yield* google(`${sheetUrl}:batchUpdate`, SCOPE, Schema.Unknown, {
            valueInputOption: 'RAW',
            data: deadRows.map(row => ({ range: row.cell, values: [[`${DELETED_TITLE_PREFIX} ${row.title}`]] })),
        })
    }
})

await run(program)
