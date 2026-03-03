'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function Filters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        
        if (value === '') {
            params.delete(key)
        } else {
            params.set(key, value)
        }
        
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-purple-500/30">
            <h2 className="text-sm font-semibold text-purple-200 mb-3">Filters</h2>
            <div className="mb-3">
                <input
                    type="text"
                    placeholder="Search meals..."
                    value={searchParams.get('search') || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-sm placeholder-slate-400"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                    value={searchParams.get('protein') || ''}
                    onChange={(e) => handleFilterChange('protein', e.target.value)}
                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-sm"
                >
                    <option value="">All Proteins</option>
                    <option value="CHICKEN_BREAST">Chicken Breast</option>
                    <option value="CHICKEN_THIGHS">Chicken Thighs</option>
                    <option value="GROUND_BEEF">Ground Beef</option>
                    <option value="PORK_BUTT">Pork Butt</option>
                    <option value="FISH">Fish</option>
                </select>
                <select
                    value={searchParams.get('category') || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-sm"
                >
                    <option value="">All Categories</option>
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                    <option value="SNACK">Snack</option>
                    <option value="DESSERT">Dessert</option>
                </select>
            </div>
        </div>
    )
}
