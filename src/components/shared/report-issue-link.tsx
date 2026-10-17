import { buildEntryReportMailto } from 'lib/contact'

/**
 * Report link of an entry, shown at the end of its links footer.
 * It opens a mail prefilled with what identifies the entry, so a report never needs a follow-up question.
 * @returns JSX.Element
 */
export default function ReportIssueLink({
    title,
    mediaLink,
}: {
    /** Human-readable title of the entry. */
    readonly title: string
    /** Media link of the entry, included in the report. */
    readonly mediaLink: string
}) {
    return (
        <a
            aria-label={`Report an issue with ${title}`}
            // eslint-disable-next-line max-len
            className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 focus-visible:outline-2 focus-visible:outline-brand-500"
            href={buildEntryReportMailto({ title, mediaLink })}
            title="Report an issue"
        >
            <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    // eslint-disable-next-line max-len
                    d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                />
            </svg>
        </a>
    )
}
