export function formatLabel(value: string): string {
    if (value === 'GRAINS_BREAD') return 'Grains & Bread'
    if (value === 'NUTS_SEEDS') return 'Nuts & Seeds'
    if (value === 'OILS_VINEGARS') return 'Oils & Vinegars'
    if (value === 'CANNED_GOODS') return 'Canned Goods'
    if (value === 'SPICES_HERBS') return 'Spices & Herbs'
    if (value === 'UNCATEGORIZED') return 'Uncategorized'
    return value
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}
