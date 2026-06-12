export function formatTasteRating(score: number): string {
    const stars = score / 2
    const displayValue = Number.isInteger(stars) ? String(stars) : stars.toFixed(1)

    return `${displayValue}★`
}
