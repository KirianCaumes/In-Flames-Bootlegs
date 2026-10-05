/**
 * Google APIs called with the service account, shared by the cron scripts.
 */
import { Data, Effect, Schema } from 'effect'
import { getGoogleAccessToken } from '../../src/lib/google/auth.ts'

/**
 * Error while calling a Google API.
 */
export class GoogleError extends Data.TaggedError('GoogleError')<{
    /** Message. */
    message: string
}> {}

/**
 * Call a Google API with the service account.
 * @param url - URL to fetch, query string included.
 * @param scope - OAuth2 scope to request.
 * @param schema - Schema of the response.
 * @param body - JSON body, POSTed when given.
 * @returns Decoded response.
 */
export const google = <A>(url: string, scope: string, schema: Schema.Decoder<A>, body?: object) =>
    Effect.gen(function* () {
        const token = yield* Effect.tryPromise({
            try: () => getGoogleAccessToken(scope),
            catch: cause => new GoogleError({ message: `Google authentication failed: ${String(cause)}` }),
        })
        const res = yield* Effect.tryPromise({
            try: async () => {
                const response = await fetch(url, {
                    method: body ? 'POST' : 'GET',
                    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
                    body: body && JSON.stringify(body),
                })
                return { ok: response.ok, status: response.status, text: await response.text() }
            },
            catch: cause => new GoogleError({ message: `Google API failed: ${String(cause)}` }),
        })
        if (!res.ok) {
            return yield* Effect.fail(new GoogleError({ message: `Google API failed: HTTP ${res.status} ${res.text}` }))
        }

        return yield* Schema.decodeUnknownEffect(Schema.fromJsonString(schema))(res.text)
    })
