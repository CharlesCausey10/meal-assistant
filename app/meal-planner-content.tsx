'use client'

import { useState } from 'react'
import type { Meal } from '@prisma/client'
import { Filters } from './filters'
import { MealList } from './meal-list'
import { MealForm } from './components/meal-form'
import { ResponsiveModal } from './components/responsive-modal'

export function MealPlannerContent({ meals }: { meals: Meal[] }) {
    const [isNewMealOpen, setIsNewMealOpen] = useState(false)
    const [isFiltersOpen, setIsFiltersOpen] = useState(false)

    return (
        <div className="h-full flex flex-col md:flex-row md:gap-6">
            <div className="md:hidden p-3 border-b border-purple-500/20 flex gap-2">
                <button
                    type="button"
                    onClick={() => setIsNewMealOpen(true)}
                    className="flex-1 bg-linear-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                    New Meal
                </button>
                <button
                    type="button"
                    onClick={() => setIsFiltersOpen(true)}
                    className="flex-1 bg-slate-800 border border-purple-500/30 text-slate-100 px-4 py-2 rounded-lg font-medium"
                >
                    Filters
                </button>
            </div>

            <div className="hidden md:block w-80 shrink-0 space-y-6 overflow-y-auto p-4 flex-1">
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-purple-500/30">
                    <h2 className="text-lg font-semibold text-purple-200 mb-3">Add New Meal</h2>
                    <MealForm />
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-purple-500/30">
                    <h2 className="text-sm font-semibold text-purple-200 mb-3">Filters</h2>
                    <Filters />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <MealList meals={meals} />
            </div>

            <ResponsiveModal title="Add New Meal" isOpen={isNewMealOpen} onClose={() => setIsNewMealOpen(false)}>
                <MealForm onSuccess={() => setIsNewMealOpen(false)} />
            </ResponsiveModal>

            <ResponsiveModal title="Filters" isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)}>
                <Filters />
            </ResponsiveModal>
        </div>
    )
}
