/** Mailbox receiving issue reports and show suggestions. */
const CONTACT_EMAIL = 'ajesterscollection@gmail.com'

/** Suffix appended to every subject, so archive mails are easy to filter. */
const SUBJECT_SUFFIX = 'In Flames Archive'

/**
 * Build a `mailto:` link to the archive mailbox.
 * @param subject - Subject, before the archive suffix.
 * @param body - Optional prefilled body.
 * @returns Mailto URL.
 */
export function buildContactMailto(subject: string, body = ''): string {
    const params = [`subject=${encodeURIComponent(`${subject} - ${SUBJECT_SUFFIX}`)}`]
    if (body) {
        params.push(`body=${encodeURIComponent(body)}`)
    }

    return `mailto:${CONTACT_EMAIL}?${params.join('&')}`
}

/**
 * Build a `mailto:` link reporting an issue with one entry, prefilled with what identifies it.
 * @param input - Entry to report.
 * @param input.title - Human-readable title of the entry.
 * @param input.mediaLink - Media link of the entry.
 * @returns Mailto URL.
 */
export function buildEntryReportMailto({
    title,
    mediaLink,
}: {
    /** Human-readable title of the entry. */
    readonly title: string
    /** Media link of the entry. */
    readonly mediaLink: string
}): string {
    const body = [
        `Entry: ${title}`,
        `Media link: ${mediaLink || '-'}`,
        '',
        "What's wrong? (dead link, wrong date, wrong setlist, better recording available...)",
        '',
    ].join('\n')

    return buildContactMailto(`Issue report: ${title}`, body)
}
