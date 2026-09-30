import { GoogleAuth } from 'google-auth-library'
import type { JWTInput } from 'google-auth-library'

/** OAuth2 scope granting read-only access to the archive Google Sheet. */
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'

/** Memoized GoogleAuth clients built from the service account credentials, keyed by scope. */
const auths = new Map<string, GoogleAuth>()

/**
 * Build (once per scope) a GoogleAuth client from the GOOGLE_API_JSON service account secret.
 * @param scope - OAuth2 scope to request.
 * @returns Memoized GoogleAuth client.
 */
function getAuth(scope: string): GoogleAuth {
    const cached = auths.get(scope)
    if (cached) {
        return cached
    }

    const raw = process.env.GOOGLE_API_JSON
    if (!raw) {
        throw new Error('Missing GOOGLE_API_JSON service account credentials')
    }

    // Re-escape real newlines (dotenv expands \n in double-quoted .env values) so the JSON with an embedded PEM private_key still parses.
    const credentials = JSON.parse(raw.replace(/\n/g, '\\n').replace(/\r/g, '\\r')) as JWTInput
    const auth = new GoogleAuth({ credentials, scopes: [scope] })
    auths.set(scope, auth)
    return auth
}

/**
 * Get an OAuth2 access token, for the Google Sheets read-only scope by default.
 * The underlying token is cached and refreshed internally by google-auth-library.
 * @param scope - OAuth2 scope to request.
 * @returns Bearer access token.
 */
export async function getGoogleAccessToken(scope = SCOPE): Promise<string> {
    const token = await getAuth(scope).getAccessToken()
    if (!token) {
        throw new Error('Failed to obtain Google access token')
    }

    return token
}
