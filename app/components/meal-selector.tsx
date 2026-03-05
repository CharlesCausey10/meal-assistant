'use client'

import { useMemo, useState } from 'react'

type MealOption = {
    id: number
    name: string
    categoryLabel: string
}

interface MealSelectorProps {
    meals: MealOption[]
}

export function MealSelector({ meals }: MealSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedMealIds, setSelectedMealIds] = useState<number[]>([])

    const normalizedQuery = searchQuery.trim().toLowerCase()

    const filteredMeals = useMemo(() => {
        if (!normalizedQuery) {
            return meals
        }

        return meals.filter((meal) => {
            return (
                meal.name.toLowerCase().includes(normalizedQuery) ||
                meal.categoryLabel.toLowerCase().includes(normalizedQuery)
            )
        })
    }, [meals, normalizedQuery])

    function toggleMeal(mealId: number) {
        setSelectedMealIds((current) => {
            if (current.includes(mealId)) {
                return current.filter((id) => id !== mealId)
            }

            return [...current, mealId]
        })
    }

    return (
        <div className="space-y-2">
            <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search meals..."
                className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100 text-sm"
            />

            {/* Keep selected meals submitted even when filtered out of view. */}
            {selectedMealIds.map((mealId) => (
                <input key={mealId} type="hidden" name="mealIds" value={mealId} />
            ))}

            <div className="border border-slate-600 rounded-lg p-3 bg-slate-900/50 max-h-60 overflow-y-auto space-y-2">
                {meals.length === 0 && (
                    <p className="text-sm text-slate-400">No meals available yet. Submitting will create an empty list.</p>
                )}

                {meals.length > 0 && filteredMeals.length === 0 && (
                    <p className="text-sm text-slate-400">No meals match your search.</p>
                )}

                {filteredMeals.map((meal) => (
                    <label
                        key={meal.id}
                        className="flex items-center gap-2 text-sm text-slate-200 hover:bg-slate-800/60 rounded p-1"
                    >
                        <input
                            type="checkbox"
                            checked={selectedMealIds.includes(meal.id)}
                            onChange={() => toggleMeal(meal.id)}
                            className="h-4 w-4 accent-purple-500"
                        />
                        <span className="font-medium">{meal.name}</span>
                        <span className="text-slate-400">({meal.categoryLabel})</span>
                    </label>
                ))}
            </div>
        </div>
    )
}
