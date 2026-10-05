/**
 * Discord notifications shared by the cron scripts, modeled on the Discogs Notification On New Items ones.
 */
import { Context, Data, Duration, Effect, Layer, Schedule } from 'effect'
import { Env } from './env.ts'

/** Discord limits of a message: https://discord.com/developers/docs/resources/message#embed-object-embed-limits */
const LIMITS = { EMBEDS: 10, TITLE: 256, DESCRIPTION: 4096, FIELDS: 25, FIELD_NAME: 256, FIELD_VALUE: 1024, FOOTER: 2048, TOTAL: 6000 }

/** Timeout of a webhook call, in milliseconds. */
const TIMEOUT_MS = 30_000

/** Color of the left border of an embed. */
export const COLORS = { Bootleg: 0xe67e22, Dead: 0xe74c3c }

/** Embed of a Discord message. */
export interface Embed {
    /** Title. */
    readonly title: string
    /** Url of the title. */
    readonly url?: string
    /** Description. */
    readonly description?: string
    /** Color of the left border. */
    readonly color?: number
    /** Fields, displayed as a grid when inline. */
    readonly fields?: Array<{
        /** Name. */
        readonly name: string
        /** Value. */
        readonly value: string
        /** Displayed next to the other inline fields. */
        readonly inline?: boolean
    }>
    /** Thumbnail. */
    readonly thumbnail?: {
        /** Url. */
        readonly url: string
    }
    /** Footer. */
    readonly footer?: {
        /** Text. */
        readonly text: string
    }
    /** ISO date, displayed in the footer. */
    readonly timestamp?: string
}

/**
 * Format a date as a Discord timestamp, displayed in the locale and time zone of the reader.
 * @param date - Date to format.
 * @param style - Discord style, such as `D` for a long date.
 * @returns Discord markup.
 */
export function discordDate(date: Date, style = 'D'): string {
    return `<t:${Math.floor(date.getTime() / 1000)}:${style}>`
}

/**
 * Error while sending a Discord message.
 */
export class DiscordError extends Data.TaggedError('DiscordError')<{
    /** Message. */
    message: string
    /** Network error, rate limit or server error: worth retrying. */
    isRetryable: boolean
}> {}

/**
 * Post a message on the webhook, retrying network errors, rate limits and server errors.
 * @param webhook - Webhook URL.
 * @param body - Message body.
 * @returns Nothing.
 */
const post = (webhook: URL, body: object) =>
    Effect.gen(function* () {
        const url = new URL(webhook)
        url.searchParams.set('wait', 'true')
        const res = yield* Effect.tryPromise({
            try: async () => {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(TIMEOUT_MS),
                })
                return {
                    status: response.status,
                    ok: response.ok,
                    text: await response.text(),
                    /** Seconds to wait when rate limited. */
                    retryAfter: Number(response.headers.get('retry-after')) || 0,
                }
            },
            catch: cause => new DiscordError({ message: String(cause), isRetryable: true }),
        })
        if (res.status === 429) {
            // Wait the time asked by Discord before retrying.
            yield* Effect.sleep(Duration.seconds(res.retryAfter))
        }
        if (!res.ok) {
            return yield* Effect.fail(
                new DiscordError({ message: `HTTP ${res.status} ${res.text}`, isRetryable: res.status === 429 || res.status >= 500 }),
            )
        }
    }).pipe(
        Effect.tapError(error => Effect.logWarning(`Discord: ${error.message}`)),
        // A client error (invalid webhook, invalid body...) will not succeed by retrying.
        Effect.retry({ times: 3, schedule: Schedule.exponential('2 seconds'), while: error => error.isRetryable }),
    )

/**
 * Characters counted by Discord for an embed.
 * @param embed - Embed.
 * @returns Characters.
 */
function getSize(embed: Embed): number {
    return (
        embed.title.length +
        (embed.description?.length ?? 0) +
        (embed.footer?.text.length ?? 0) +
        (embed.fields ?? []).reduce((total, field) => total + field.name.length + field.value.length, 0)
    )
}

/**
 * Cut an embed to the Discord limits.
 * @param embed - Embed.
 * @returns Embed.
 */
function truncate(embed: Embed): Embed {
    return {
        ...embed,
        title: embed.title.slice(0, LIMITS.TITLE),
        description: embed.description?.slice(0, LIMITS.DESCRIPTION),
        fields: embed.fields
            ?.slice(0, LIMITS.FIELDS)
            .map(field => ({ ...field, name: field.name.slice(0, LIMITS.FIELD_NAME), value: field.value.slice(0, LIMITS.FIELD_VALUE) })),
        footer: embed.footer && { text: embed.footer.text.slice(0, LIMITS.FOOTER) },
    }
}

/**
 * Split embeds in messages, respecting the Discord limits of embeds and characters per message.
 * @param embeds - Embeds.
 * @returns Embeds by message.
 */
function chunkEmbeds(embeds: Array<Embed>): Array<Array<Embed>> {
    return embeds.map(truncate).reduce<Array<Array<Embed>>>((chunks, embed) => {
        const last = chunks.at(-1)
        if (last && last.length < LIMITS.EMBEDS && last.reduce((total, e) => total + getSize(e), 0) + getSize(embed) <= LIMITS.TOTAL) {
            last.push(embed)
        } else {
            chunks.push([embed])
        }
        return chunks
    }, [])
}

/**
 * Send a message on a webhook, split in several messages when there are too many embeds.
 * Every message is tried, so one failing does not prevent the others from being sent.
 * @param webhook - Webhook URL.
 * @param content - Text of the first message, as Discord markdown.
 * @param embeds - Embeds, one per entry.
 * @returns Nothing, fails when a message failed.
 */
const sendDiscord = (webhook: URL, content: string, embeds: Array<Embed>) =>
    Effect.gen(function* () {
        const chunks = chunkEmbeds(embeds)
        // In order, so the messages keep the order of the entries.
        const results = yield* Effect.forEach(chunks, (chunk, index) =>
            post(webhook, index === 0 ? { content, embeds: chunk } : { embeds: chunk }).pipe(
                Effect.as(undefined),
                Effect.catchTag('DiscordError', error => Effect.succeed(error)),
            ),
        )
        const errors = results.filter(error => error !== undefined)
        if (errors.length > 0) {
            return yield* Effect.fail(
                new DiscordError({
                    message: `${errors.length} of ${chunks.length} message(s) not sent: ${errors.map(error => error.message).join(', ')}`,
                    isRetryable: false,
                }),
            )
        }
    })

/**
 * Notifications on Discord.
 */
export class Discord extends Context.Service<
    Discord,
    {
        /** Send a message, split in several messages when there are too many embeds. */
        readonly send: (content: string, embeds: Array<Embed>) => Effect.Effect<void, DiscordError>
    }
>()('Discord') {}

/**
 * Messages sent on the DISCORD_WEBHOOK_URL.
 */
export const DiscordLive = Layer.effect(
    Discord,
    Effect.gen(function* () {
        const { DISCORD_WEBHOOK_URL } = yield* Env
        return { send: (content, embeds) => sendDiscord(DISCORD_WEBHOOK_URL, content, embeds) }
    }),
)
