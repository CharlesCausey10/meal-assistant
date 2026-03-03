'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function Filters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleSearchChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (value === '') {
            params.delete('search')
        } else {
            params.set('search', value)
        }

        router.push(`?${params.toString()}`)
    }

    const handleCheckboxChange = (key: string, value: string, checked: boolean) => {
        const params = new URLSearchParams(searchParams.toString())
        const current = params.get(key)?.split(',').filter(Boolean) || []

        let updated: string[]
        if (checked) {
            updated = [...current, value]
        } else {
            updated = current.filter(v => v !== value)
        }

        if (updated.length === 0) {
            params.delete(key)
        } else {
            params.set(key, updated.join(','))
        }

        router.push(`?${params.toString()}`)
    }

    const isChecked = (key: string, value: string) => {
        const current = searchParams.get(key)?.split(',').filter(Boolean) || []
        return current.includes(value)
    }

    const clearSearch = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('search')
        router.push(`?${params.toString()}`)
    }

    const clearProtein = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('protein')
        router.push(`?${params.toString()}`)
    }

    const clearCategory = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('category')
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="bg-slate-800 p-4 rounded-xl border border-purple-500/30">
            <h2 className="text-sm font-semibold text-purple-200 mb-3">Filters</h2>
            <div className="mb-3">
                <div className="flex gap-2">
                    <button
                        disabled={!searchParams.get('search')}
                        onClick={clearSearch}
                        className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg p-2 transition-colors disabled:text-slate-600 disabled:hover:bg-transparent"
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                    <input
                        type="text"
                        placeholder="Search meals..."
                        value={searchParams.get('search') || ''}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="flex-1 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-sm placeholder-slate-400"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {searchParams.get('protein') && (
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
                    <div className="space-y-1">
                        {[
                            { value: 'CHICKEN_BREAST', label: '🐔 Chicken Breast' },
                            { value: 'CHICKEN_THIGHS', label: '🐔 Chicken Thighs' },
                            { value: 'ROTISSERIE_CHICKEN', label: '🐔 Rotisserie Chicken' },
                            { value: 'GROUND_BEEF', label: '🐄 Ground Beef' },
                            { value: 'PORK_BUTT', label: '🐷 Pork Butt' },
                            { value: 'FISH', label: '🐟 Fish' },
                            { value: 'EGGS', label: '🥚 Eggs' },
                        ].map(({ value, label }) => (
                            <label key={value} className="flex items-center gap-2 text-sm text-slate-200 hover:text-purple-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isChecked('protein', value)}
                                    onChange={(e) => handleCheckboxChange('protein', value, e.target.checked)}
                                    className="rounded border-slate-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 bg-slate-900/80"
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {searchParams.get('category') && (
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
                    <div className="space-y-1">
                        {[
                            { value: 'BREAKFAST', label: 'Breakfast' },
                            { value: 'LUNCH', label: 'Lunch' },
                            { value: 'DINNER', label: 'Dinner' },
                            { value: 'SIDE_STARTER', label: 'Side/Starter' },
                            { value: 'SNACK', label: 'Snack' },
                            { value: 'DESSERT', label: 'Dessert' },
                        ].map(({ value, label }) => (
                            <label key={value} className="flex items-center gap-2 text-sm text-slate-200 hover:text-purple-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isChecked('category', value)}
                                    onChange={(e) => handleCheckboxChange('category', value, e.target.checked)}
                                    className="rounded border-slate-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 bg-slate-900/80"
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
