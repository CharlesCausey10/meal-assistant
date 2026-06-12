'use client'

import { PROTEIN_OPTIONS } from './utils/protein'

type FiltersProps = {
    selectedProteins: string[]
    onProteinsChange: (proteins: string[]) => void
    selectedCategories: string[]
    onCategoriesChange: (categories: string[]) => void
}

const PROTEIN_FILTER_OPTIONS = [
    { value: 'NO_PROTEIN', label: 'No protein' },
    ...PROTEIN_OPTIONS,
]

const CATEGORY_FILTER_OPTIONS = [
    { value: 'BREAKFAST', label: 'Breakfast' },
    { value: 'LUNCH', label: 'Lunch' },
    { value: 'DINNER', label: 'Dinner' },
    { value: 'SIDE_STARTER', label: 'Side/Starter' },
    { value: 'SNACK', label: 'Snack' },
    { value: 'DESSERT', label: 'Dessert' },
]

export function Filters({
    selectedProteins,
    onProteinsChange,
    selectedCategories,
    onCategoriesChange,
}: FiltersProps) {
    const handleCheckboxChange = (key: string, value: string, checked: boolean) => {
        const current = key === 'protein' ? selectedProteins : selectedCategories

        const updated = checked
            ? [...current, value]
            : current.filter((currentValue) => currentValue !== value)

        if (key === 'protein') {
            onProteinsChange(updated)
        } else {
            onCategoriesChange(updated)
        }
    }

    const isChecked = (key: string, value: string) => {
        const current = key === 'protein' ? selectedProteins : selectedCategories
        return current.includes(value)
    }

    const clearProtein = () => {
        onProteinsChange([])
    }

    const clearCategory = () => {
        onCategoriesChange([])
    }

    return (
        <div className="space-y-3">
            <div className="md:hidden space-y-2" aria-label="Filters">
                <h3 className="text-sm font-semibold text-primary-text">Refine</h3>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" aria-label="Protein filters">
                    {PROTEIN_FILTER_OPTIONS.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => handleCheckboxChange('protein', value, !isChecked('protein', value))}
                            className={`px-3 py-2 rounded-full text-base font-medium transition-all shrink-0 ${
                                isChecked('protein', value)
                                    ? 'bg-primary text-primary-contrast border border-primary'
                                    : 'bg-app-surface-soft text-app-text/85 border border-app-border hover:border-primary'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" aria-label="Category filters">
                    {CATEGORY_FILTER_OPTIONS.map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => handleCheckboxChange('category', value, !isChecked('category', value))}
                            className={`px-3 py-2 rounded-full text-base font-medium transition-all shrink-0 ${
                                isChecked('category', value)
                                    ? 'bg-primary text-primary-contrast border border-primary'
                                    : 'bg-app-surface-soft text-app-text/85 border border-app-border hover:border-primary'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="hidden rounded-lg border border-app-border bg-app-surface/80 p-3 md:flex md:flex-col gap-3">
                <div>
                    <h3 className="text-base font-semibold text-app-text">Filters</h3>
                    <p className="text-sm text-app-muted">Browse by protein or meal window.</p>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {selectedProteins.length > 0 && (
                            <button
                                onClick={clearProtein}
                                className="text-app-subtle hover:text-app-text/85 hover:bg-app-surface-soft/80 rounded-md py-1 px-2 transition-colors text-xs"
                                aria-label="Clear proteins"
                            >
                                X
                            </button>
                        )}
                        <h3 className="text-xs py-1 font-medium text-primary-text">Proteins</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {PROTEIN_FILTER_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => handleCheckboxChange('protein', value, !isChecked('protein', value))}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                                    isChecked('protein', value)
                                        ? 'bg-primary text-primary-contrast border border-primary'
                                        : 'bg-app-surface-soft text-app-text/85 border border-app-border hover:border-primary'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {selectedCategories.length > 0 && (
                            <button
                                onClick={clearCategory}
                                className="text-app-subtle hover:text-app-text/85 hover:bg-app-surface-soft/80 rounded-md py-1 px-2 transition-colors text-xs"
                                aria-label="Clear categories"
                            >
                                X
                            </button>
                        )}
                        <h3 className="text-xs py-1 font-medium text-primary-text">Categories</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORY_FILTER_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => handleCheckboxChange('category', value, !isChecked('category', value))}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                                    isChecked('category', value)
                                        ? 'bg-primary text-primary-contrast border border-primary'
                                        : 'bg-app-surface-soft text-app-text/85 border border-app-border hover:border-primary'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
