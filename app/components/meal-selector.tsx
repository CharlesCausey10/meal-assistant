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
                className="w-full border border-app-border focus:border-primary focus:outline-none p-2 rounded bg-app-surface-raised/90 text-app-text text-sm"
            />

            {/* Keep selected meals submitted even when filtered out of view. */}
            {selectedMealIds.map((mealId) => (
                <input key={mealId} type="hidden" name="mealIds" value={mealId} />
            ))}

            <div className="border border-app-border rounded-lg p-3 bg-app-surface/70 max-h-60 overflow-y-auto space-y-2">
                {meals.length === 0 && (
                    <p className="text-sm text-app-subtle">No meals available yet. Submitting will create an empty list.</p>
                )}

                {meals.length > 0 && filteredMeals.length === 0 && (
                    <p className="text-sm text-app-subtle">No meals match your search.</p>
                )}

                {filteredMeals.map((meal) => (
                    <label
                        key={meal.id}
                        className="flex items-center gap-2 text-sm text-app-text/85 hover:bg-app-surface/85 rounded p-1"
                    >
                        <input
                            type="checkbox"
                            checked={selectedMealIds.includes(meal.id)}
                            onChange={() => toggleMeal(meal.id)}
                            className="h-4 w-4 accent-primary"
                        />
                        <span className="font-medium">{meal.name}</span>
                        <span className="text-app-subtle">({meal.categoryLabel})</span>
                    </label>
                ))}
            </div>
        </div>
    )
}
