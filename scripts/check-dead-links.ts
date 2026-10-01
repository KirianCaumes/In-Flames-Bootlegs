/**
 * Dead link checker, meant to be run by a cron: `npm run check-links` (`-- --dry-run` to only print).
 *
 * Checks the `Link` of every row, emails the dead ones, then prefixes their title with 💀 in the sheet.
 * 💀 rows are skipped, so a dead link is reported once. Removing the 💀 once it is restored puts it back under watch.
 */
import nextEnv from '@next/env'
import { getGoogleAccessToken } from '../src/lib/google/auth.ts'
import { getLocale, getSheetLink, sendMail } from './utils/mail.ts'
import { getYoutubePlaylistId, getYoutubeVideoId, getYoutubeVideos, youtube } from './utils/youtube.ts'
import type { YoutubePlaylistItem } from './utils/youtube.ts'
import type { GoogleApiResponse } from '../src/lib/google/sheets.ts'

nextEnv.loadEnvConfig(process.cwd())

/** Sheet tabs to check. */
const SHEETS = ['Live show', 'Various']

/** Prefix marking a sheet row as deleted. Mirrors `DELETED_TITLE_PREFIX`, which cannot be imported without the `lib/*` path alias. */
const DELETED_TITLE_PREFIX = '💀'

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
interface SheetValues {
    /** One range per requested tab, in order. */
    readonly valueRanges: Array<GoogleApiResponse>
}

/**
 * Tell whether a link is dead.
 * YouTube goes through the Data API, since a watch page answers 200 even for a deleted video: a playlist is dead once all its videos are.
 * Anything else is dead on a 404 or 410 only, since 403, 5xx or a network error are often bot protection or transient.
 * @param link - Link to check.
 * @returns True when the link is dead.
 */
async function isDead(link: string): Promise<boolean> {
    const videoId = getYoutubeVideoId(link)
    if (videoId) {
        return (await getYoutubeVideos([videoId], 'id')).length === 0
    }

    const playlistId = getYoutubePlaylistId(link)
    if (playlistId) {
        // Page by page, stopping at the first page holding an alive video.
        let pageToken = ''
        do {
            const page = await youtube<YoutubePlaylistItem>('playlistItems', {
                part: 'contentDetails',
                playlistId,
                maxResults: '50',
                pageToken,
            })
            if (
                (
                    await getYoutubeVideos(
                        page.items.map(item => item.contentDetails.videoId),
                        'id',
                    )
                ).length > 0
            ) {
                return false
            }
            pageToken = page.nextPageToken ?? ''
        } while (pageToken)

        return true
    }

    try {
        const response = await fetch(link, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(20_000),
        })
        return response.status === 404 || response.status === 410
    } catch (error) {
        console.warn(`Could not check ${link}: ${String(error)}`)
        return false
    }
}

const token = await getGoogleAccessToken('https://www.googleapis.com/auth/spreadsheets')
const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID ?? ''}/values`

const response = await fetch(`${sheetUrl}:batchGet?${new URLSearchParams(SHEETS.map(sheet => ['ranges', sheet])).toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
})
if (!response.ok) {
    throw new Error(`Failed to read the sheet: HTTP ${response.status} ${await response.text()}`)
}

const { valueRanges } = (await response.json()) as SheetValues
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

const isRowDead = await Promise.all(rows.map(row => isDead(row.link)))
const deadRows = rows.filter((_, index) => isRowDead[index])
console.log(`${deadRows.length} dead link(s)\n${deadRows.map(row => `- ${row.cell} ${row.title}: ${row.link}`).join('\n')}`)

if (deadRows.length > 0 && !process.argv.includes('--dry-run')) {
    // Mail first: if sending fails, the rows are not marked and get reported on the next run.
    const count = deadRows.length.toLocaleString(getLocale())
    await sendMail(
        `In Flames Bootlegs - ${count} dead link(s)`,
        `<b>${count}</b> dead link${deadRows.length > 1 ? 's' : ''} found in the ` +
            `<a href="${getSheetLink()}" target="_blank" rel="noopener">In Flames Bootlegs</a> sheet, now marked with ${DELETED_TITLE_PREFIX},`,
        deadRows.map(row => ({
            href: getSheetLink(),
            title: row.title,
            lines: [`${row.sheet}, row ${row.row}${row.date ? ` (${row.date})` : ''}`],
            link: row.link,
        })),
    )

    const update = await fetch(`${sheetUrl}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            valueInputOption: 'RAW',
            data: deadRows.map(row => ({ range: row.cell, values: [[`${DELETED_TITLE_PREFIX} ${row.title}`]] })),
        }),
    })
    if (!update.ok) {
        throw new Error(`Failed to mark dead rows: HTTP ${update.status} ${await update.text()}`)
    }
}
