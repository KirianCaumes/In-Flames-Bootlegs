'use client'

/**
 * Free-text search box with a leading search icon and a clear button.
 * @returns JSX.Element
 */
export default function SearchInput({
    id,
    label,
    placeholder,
    value,
    onChange,
}: {
    /** Unique identifier of the input. */
    readonly id: string
    /** Accessible label, visually hidden: the icon and placeholder carry it on screen. */
    readonly label: string
    /** Placeholder text, giving an example query. */
    readonly placeholder: string
    /** Current value. */
    readonly value: string
    /** Change handler. */
    readonly onChange: (value: string) => void
}) {
    return (
        <div className="relative">
            <label
                className="sr-only"
                htmlFor={id}
            >
                {label}
            </label>
            <svg
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                />
            </svg>
            <input
                autoComplete="off"
                // eslint-disable-next-line max-len
                className="w-full bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-xl pl-11 pr-10 py-3 text-base sm:text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all [&::-webkit-search-cancel-button]:hidden"
                enterKeyHint="search"
                id={id}
                onChange={e => {
                    onChange(e.target.value)
                }}
                placeholder={placeholder}
                type="search"
                value={value}
            />
            {value && (
                <button
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-500 cursor-pointer"
                    onClick={() => {
                        onChange('')
                    }}
                    type="button"
                >
                    <svg
                        aria-hidden="true"
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            d="M6 18L18 6M6 6l12 12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                        />
                    </svg>
                </button>
            )}
        </div>
    )
}
