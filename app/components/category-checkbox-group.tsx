'use client'

import { useState } from 'react'
import { MEAL_CATEGORY_OPTIONS, getMealCategoryLabel } from '../utils/categories'

type CategoryCheckboxGroupProps = {
    defaultCategories?: string[]
    compact?: boolean
}

export function CategoryCheckboxGroup({
    defaultCategories = [],
    compact = false,
}: CategoryCheckboxGroupProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        defaultCategories.length > 0 ? defaultCategories : []
    )

    function toggleCategory(category: string) {
        setSelectedCategories((current) => {
            if (current.includes(category)) {
                return current.filter((value) => value !== category)
            }

            return [...current, category]
        })
    }

    return (
        <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase text-app-subtle">
                Meal windows
            </legend>
            <div className="flex flex-wrap gap-2">
                {MEAL_CATEGORY_OPTIONS.map((category) => {
                    const isSelected = selectedCategories.includes(category)

                    return (
                        <label
                            key={category}
                            className={`cursor-pointer rounded-full border px-3 font-semibold transition-colors ${
                                compact ? 'py-1.5 text-xs' : 'py-2 text-sm'
                            } ${
                                isSelected
                                    ? 'border-primary bg-primary text-primary-contrast'
                                    : 'border-app-border bg-app-surface-soft text-app-text/85 hover:border-primary'
                            }`}
                        >
                            <input
                                type="checkbox"
                                name="categories"
                                value={category}
                                checked={isSelected}
                                onChange={() => toggleCategory(category)}
                                className="sr-only"
                            />
                            {getMealCategoryLabel(category)}
                        </label>
                    )
                })}
            </div>
            {selectedCategories.length === 0 ? (
                <p className="text-xs text-danger">Choose at least one meal window.</p>
            ) : null}
        </fieldset>
    )
}
