'use client'

type FiltersProps = {
    searchValue: string
    onSearchChange: (value: string) => void
    selectedProteins: string[]
    onProteinsChange: (proteins: string[]) => void
    selectedCategories: string[]
    onCategoriesChange: (categories: string[]) => void
}

const PROTEIN_FILTER_OPTIONS = [
    { value: 'NO_PROTEIN', label: 'No protein' },
    { value: 'EGGS', label: '🥚 Eggs' },
    { value: 'CHICKEN_BREAST', label: '🐔 Chicken Breast' },
    { value: 'CHICKEN_THIGHS', label: '🐔 Chicken Thighs' },
    { value: 'ROTISSERIE_CHICKEN', label: '🐔 Rotisserie Chicken' },
    { value: 'GROUND_BEEF', label: '🐄 Ground Beef' },
    { value: 'PORK_BUTT', label: '🐷 Pork Butt' },
    { value: 'FISH', label: '🐟 Fish' },
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
    searchValue,
    onSearchChange,
    selectedProteins,
    onProteinsChange,
    selectedCategories,
    onCategoriesChange,
}: FiltersProps) {

    const handleCheckboxChange = (key: string, value: string, checked: boolean) => {
        const current = key === 'protein' ? selectedProteins : selectedCategories

        let updated: string[]
        if (checked) {
            updated = [...current, value]
        } else {
            updated = current.filter(v => v !== value)
        }

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

    const clearSearch = () => {
        onSearchChange('')
    }

    const clearProtein = () => {
        onProteinsChange([])
    }

    const clearCategory = () => {
        onCategoriesChange([])
    }

    return (
        <div>
            <div className="hidden md:block mb-3">
                <div className="flex gap-2">
                    <button
                        disabled={!searchValue}
                        onClick={clearSearch}
                        className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg p-2 transition-colors disabled:text-slate-600 disabled:hover:bg-transparent"
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                    <input
                        type="text"
                        placeholder="Search meals..."
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="flex-1 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-sm placeholder-slate-400"
                    />
                </div>
            </div>
            {/* Mobile: Compact pill rows */}
            <div className="md:hidden space-y-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" aria-label="Protein filters">
                        {PROTEIN_FILTER_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => handleCheckboxChange('protein', value, !isChecked('protein', value))}
                                className={`px-3 py-2 rounded-full text-base font-medium transition-all shrink-0 ${
                                    isChecked('protein', value)
                                        ? 'bg-purple-500 text-white border border-purple-400'
                                        : 'bg-slate-700 text-slate-200 border border-slate-600 hover:border-purple-400'
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
                                        ? 'bg-purple-500 text-white border border-purple-400'
                                        : 'bg-slate-700 text-slate-200 border border-slate-600 hover:border-purple-400'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                </div>
            </div>

            {/* Desktop: Pill Button Layout */}
            <div className="hidden md:flex md:flex-col gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {selectedProteins.length > 0 && (
                            <button
                                onClick={clearProtein}
                                className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md py-1 px-2 transition-colors text-xs"
                                aria-label="Clear proteins"
                            >
                                ✕
                            </button>
                        )}
                        <h3 className="text-xs py-1 font-medium text-purple-300">Proteins</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {PROTEIN_FILTER_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => handleCheckboxChange('protein', value, !isChecked('protein', value))}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                                    isChecked('protein', value)
                                        ? 'bg-purple-500 text-white border border-purple-400'
                                        : 'bg-slate-700 text-slate-200 border border-slate-600 hover:border-purple-400'
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
                                className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md py-1 px-2 transition-colors text-xs"
                                aria-label="Clear categories"
                            >
                                ✕
                            </button>
                        )}
                        <h3 className="text-xs py-1 font-medium text-purple-300">Categories</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORY_FILTER_OPTIONS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => handleCheckboxChange('category', value, !isChecked('category', value))}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                                    isChecked('category', value)
                                        ? 'bg-purple-500 text-white border border-purple-400'
                                        : 'bg-slate-700 text-slate-200 border border-slate-600 hover:border-purple-400'
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
