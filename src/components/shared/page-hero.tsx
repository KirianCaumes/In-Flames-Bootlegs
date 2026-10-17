/** One figure of the hero's stat strip. */
export interface HeroStat {
    /** What the figure counts. */
    readonly label: string
    /** The figure itself. */
    readonly value: string
}

/**
 * Introduction block at the top of a page: the page's `<h1>`, a short pitch and a strip of figures.
 * Deliberately flat (no panel, no glow): it reads as the page's heading, and the cards below stay the focus.
 * @returns JSX.Element
 */
export default function PageHero({
    title,
    description,
    stats,
}: {
    /** Page title, rendered as the page's only `<h1>`. */
    readonly title: string
    /** One or two sentences on what the page holds. */
    readonly description: string
    /** Figures summing up the page's content. */
    readonly stats: Array<HeroStat>
}) {
    return (
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10 pt-2 pb-6 mb-6 border-b border-gray-800">
            <div className="max-w-2xl">
                <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-wide text-gray-50">{title}</h1>
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-gray-400">{description}</p>
            </div>

            {stats.length > 0 && (
                <dl className="grid grid-cols-2 gap-y-4 sm:flex sm:shrink-0">
                    {stats.map(({ label, value }) => (
                        <div
                            className="flex flex-col-reverse gap-0.5 sm:border-l sm:border-gray-800 sm:px-5 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
                            key={label}
                        >
                            <dt className="text-xs text-gray-400">{label}</dt>
                            <dd className="font-mono text-lg sm:text-xl font-medium tabular-nums text-gray-100">{value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </section>
    )
}
