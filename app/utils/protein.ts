export const PROTEIN_OPTIONS = [
    { value: 'CHICKEN_BREAST', label: 'Chicken Breast' },
    { value: 'CHICKEN_THIGHS', label: 'Chicken Thighs' },
    { value: 'ROTISSERIE_CHICKEN', label: 'Rotisserie Chicken' },
    { value: 'GROUND_BEEF', label: 'Ground Beef' },
    { value: 'PORK_BUTT', label: 'Pork Butt' },
    { value: 'FISH', label: 'Fish' },
    { value: 'EGGS', label: 'Eggs' },
] as const

export function formatProtein(protein: string | null): string {
    if (!protein) {
        return ''
    }

    return PROTEIN_OPTIONS.find((option) => option.value === protein)?.label
        ?? protein.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function isProteinValue(value: string): boolean {
    return PROTEIN_OPTIONS.some((option) => option.value === value)
}
