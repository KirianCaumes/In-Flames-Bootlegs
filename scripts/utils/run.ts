/**
 * Runner of the cron scripts.
 */
import { Cause, Effect, Exit, Layer } from 'effect'
import { DiscordLive } from './discord.ts'
import { EnvLive } from './env.ts'
import type { Discord } from './discord.ts'
import type { Env } from './env.ts'

/**
 * Run a script with the environment and Discord, exiting with 1 when it fails.
 * The layers are built first, so an invalid environment fails before any call.
 * @param program - Script to run.
 */
export async function run(program: Effect.Effect<void, unknown, Env | Discord>): Promise<void> {
    const exit = await Effect.runPromiseExit(program.pipe(Effect.provide(DiscordLive.pipe(Layer.provideMerge(EnvLive)))))
    if (Exit.isFailure(exit)) {
        console.error(Cause.pretty(exit.cause))
        process.exitCode = 1
    }
}
