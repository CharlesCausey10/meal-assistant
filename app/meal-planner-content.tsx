'use client'

import { useState } from 'react'
import type { Meal, MealIngredient, Ingredient } from '@prisma/client'
import { Filters } from './filters'
import { MealList } from './meal-list'
import { MealForm } from './components/meal-form'
import { ResponsiveModal } from './components/responsive-modal'

type MealWithIngredients = Meal & {
    ingredients: Array<MealIngredient & { ingredient: Ingredient }>
}

export function MealPlannerContent({ meals }: { meals: MealWithIngredients[] }) {
    const [isNewMealOpen, setIsNewMealOpen] = useState(false)
    const [isFiltersOpen, setIsFiltersOpen] = useState(false)

    return (
        <div className="h-full flex flex-col md:flex-row">
            <div className="md:hidden p-3 border-b border-purple-500/20 flex gap-2">
                <button
                    type="button"
                    onClick={() => setIsFiltersOpen(true)}
                    className="flex-1 bg-slate-800 border border-purple-500/30 text-slate-100 px-4 py-2 rounded-lg font-medium"
                >
                    Filters
                </button>
                <button
                    type="button"
                    onClick={() => setIsNewMealOpen(true)}
                    className="bg-linear-to-r from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg font-medium text-xl"
                >
                    +
                </button>
            </div>

            <div className="hidden md:flex md:w-1/2 md:flex-col md:p-4">
                <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-purple-500/30">
                    <h2 className="text-lg font-semibold text-purple-200 mb-3">Add New Meal</h2>
                    <MealForm />
                </div>
            </div>

            <div className="flex-1 md:w-1/2 flex flex-col gap-4 p-4 overflow-hidden">
                {/* <div className="bg-slate-800 p-4 rounded-xl border border-purple-500/30 shrink-0"> */}
                <Filters />
                {/* </div> */}
                <div className="flex-1 overflow-y-auto">
                    <MealList meals={meals} />
                </div>
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
