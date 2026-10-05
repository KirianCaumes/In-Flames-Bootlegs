/**
 * Environment of the cron scripts, read from `.env.local` and checked once at the start of the run.
 */
import nextEnv from '@next/env'
import { Config, Context, Effect, Layer } from 'effect'

nextEnv.loadEnvConfig(process.cwd())

/**
 * Environment variables.
 */
export class Env extends Context.Service<
    Env,
    {
        /** YouTube Data API key. */
        readonly GOOGLE_API_KEY: string
        /** ID of the Google Sheet. */
        readonly GOOGLE_SHEET_ID: string
        /** Discord webhook the reports are posted on. */
        readonly DISCORD_WEBHOOK_URL: URL
    }
>()('Env') {}

/**
 * Environment variables of `process.env`: an empty one is considered as not set.
 */
export const EnvLive = Layer.effect(
    Env,
    Effect.gen(function* () {
        const env = yield* Config.all({
            // Read by `getGoogleAccessToken`, only checked here.
            GOOGLE_API_JSON: Config.NonEmptyString('GOOGLE_API_JSON'),
            GOOGLE_API_KEY: Config.NonEmptyString('GOOGLE_API_KEY'),
            GOOGLE_SHEET_ID: Config.NonEmptyString('GOOGLE_SHEET_ID'),
            DISCORD_WEBHOOK_URL: Config.URL('DISCORD_WEBHOOK_URL'),
        })
        return { GOOGLE_API_KEY: env.GOOGLE_API_KEY, GOOGLE_SHEET_ID: env.GOOGLE_SHEET_ID, DISCORD_WEBHOOK_URL: env.DISCORD_WEBHOOK_URL }
    }),
)
