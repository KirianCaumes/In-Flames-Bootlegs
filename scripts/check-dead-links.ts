/**
 * Dead link checker, meant to be run by a cron: `npm run check-links` (`-- --dry-run` to only print).
 *
 * Checks the `Link` of every row, emails the dead ones, then prefixes their title with 💀 in the sheet.
 * 💀 rows are skipped, so a dead link is reported once. Removing the 💀 once it is restored puts it back under watch.
 */
import nextEnv from '@next/env'
import nodemailer from 'nodemailer'
import { getGoogleAccessToken } from '../src/lib/google/auth.ts'
import type { GoogleApiResponse } from '../src/lib/google/sheets.ts'

nextEnv.loadEnvConfig(process.cwd())

/** Sheet tabs to check. */
const SHEETS = ['Live show', 'Various']

/** Prefix marking a sheet row as deleted. Mirrors `DELETED_TITLE_PREFIX`, which cannot be imported without the `lib/*` path alias. */
const DELETED_TITLE_PREFIX = '💀'

/** A sheet row whose link is dead. */
interface DeadRow {
    /** Title cell, in A1 notation. */
    readonly cell: string
    /** Row title. */
    readonly title: string
    /** Dead link. */
    readonly link: string
}

/**
 * Tell whether a link is dead.
 * YouTube goes through the Data API: a watch page answers 200 even for a deleted video.
 * Anything else is dead on a 404 or 410 only, since 403 or 5xx are often bot protection or transient.
 * @param link - Link to check.
 * @returns True when the link is dead.
 */
async function isDead(link: string): Promise<boolean> {
    const url = new URL(link)

    if (url.hostname.endsWith('youtube.com') || url.hostname === 'youtu.be') {
        const videoId = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v')
        const [kind, id] = videoId ? ['videos', videoId] : ['playlists', url.searchParams.get('list')]
        const api = new URL(`https://www.googleapis.com/youtube/v3/${kind}`)
        api.searchParams.set('part', 'id')
        api.searchParams.set('id', id ?? '')
        api.searchParams.set('key', process.env.GOOGLE_API_KEY ?? '')
        const response = await fetch(api)
        if (!response.ok) {
            throw new Error(`YouTube API failed: HTTP ${response.status}`)
        }

        // Deleted and private resources are missing from the response.
        return (
            (
                (await response.json()) as {
                    /** Resources found: deleted and private ones are missing. */
                    readonly items: Array<unknown>
                }
            ).items.length === 0
        )
    }

    const response = await fetch(link, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36' },
    })
    return response.status === 404 || response.status === 410
}

const token = await getGoogleAccessToken('https://www.googleapis.com/auth/spreadsheets')
const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID ?? ''}/values`
const deadRows: Array<DeadRow> = []

for (const sheet of SHEETS) {
    const response = await fetch(`${sheetUrl}/${encodeURIComponent(`${sheet}!A1:Z9999`)}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    const [headers = [], ...rows] = ((await response.json()) as GoogleApiResponse).values ?? []
    const titleColumn = headers.indexOf('Title')
    const linkColumn = headers.indexOf('Link')

    for (const [index, row] of rows.entries()) {
        const title = row[titleColumn] ?? ''
        const link = row[linkColumn]?.trim()
        if (title && link && !title.startsWith(DELETED_TITLE_PREFIX) && (await isDead(link))) {
            // + 2: rows are 1-based and the header row was taken out.
            deadRows.push({ cell: `${sheet}!${String.fromCharCode(65 + titleColumn)}${index + 2}`, title, link })
        }
    }
}

const report = deadRows.map(row => `- ${row.cell} ${row.title}: ${row.link}`).join('\n')
console.log(`${deadRows.length} dead link(s)\n${report}`)

if (deadRows.length > 0 && !process.argv.includes('--dry-run')) {
    // Mail first: if sending fails, the rows are not marked and get reported on the next run.
    await nodemailer
        .createTransport({
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            secure: process.env.MAIL_PORT === '465',
            auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        })
        .sendMail({
            from: process.env.MAIL_FROM,
            to: process.env.MAIL_TO,
            subject: `In Flames Bootlegs - ${deadRows.length} dead link(s)`,
            text: `These rows have been marked with ${DELETED_TITLE_PREFIX}:\n\n${report}\n`,
        })

    const response = await fetch(`${sheetUrl}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            valueInputOption: 'RAW',
            data: deadRows.map(row => ({ range: row.cell, values: [[`${DELETED_TITLE_PREFIX} ${row.title}`]] })),
        }),
    })
    if (!response.ok) {
        throw new Error(`Failed to mark dead rows: HTTP ${response.status} ${await response.text()}`)
    }
}
