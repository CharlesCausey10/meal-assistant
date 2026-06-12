'use client'

import { useMemo, useState } from 'react'
import { Filters } from './filters'
import { MealList } from './meal-list'
import { hasMealCategory } from './utils/categories'
import type { SerializedMealWithIngredients } from './utils/convert-prisma'

const NO_PROTEIN_FILTER = 'NO_PROTEIN'

type TodayAllMealsSectionProps = {
    meals: SerializedMealWithIngredients[]
    groceryLists: Array<{
        id: number
        name: string
    }>
}

export function TodayAllMealsSection({ meals, groceryLists }: TodayAllMealsSectionProps) {
    const [selectedProteins, setSelectedProteins] = useState<string[]>([])
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])

    const filteredMeals = useMemo(() => {
        return meals.filter((meal) => {
            const proteinMatches = selectedProteins.length === 0
                ? true
                : meal.protein === null
                    ? selectedProteins.includes(NO_PROTEIN_FILTER)
                    : selectedProteins.includes(meal.protein)
            const categoryMatches = selectedCategories.length === 0
                ? true
                : selectedCategories.some((category) => hasMealCategory(meal, category))

            return proteinMatches && categoryMatches
        })
    }, [meals, selectedProteins, selectedCategories])

    return (
        <section>
            <div className="mb-2 px-1">
                <h2 className="text-lg font-semibold text-app-text">All Meals</h2>
                <p className="text-sm text-app-muted">Browse the full meal set by protein or meal window.</p>
            </div>
            <div className="space-y-3">
                {filteredMeals.length > 0 ? (
                    <MealList meals={filteredMeals} groceryLists={groceryLists} variant="rail" />
                ) : (
                    <div className="rounded-lg border border-app-border bg-app-surface/80 p-4 text-sm text-app-subtle">
                        No meals match those filters.
                    </div>
                )}
                <Filters
                    selectedProteins={selectedProteins}
                    onProteinsChange={setSelectedProteins}
                    selectedCategories={selectedCategories}
                    onCategoriesChange={setSelectedCategories}
                />
            </div>
        </section>
    )
}
