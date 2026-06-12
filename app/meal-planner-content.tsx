'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { SerializedMealWithIngredients } from './utils/convert-prisma'
import { MealList } from './meal-list'
import { MealForm } from './components/meal-form'
import { ResponsiveModal } from './components/responsive-modal'

type MealPlannerContentProps = {
    meals: SerializedMealWithIngredients[]
    groceryLists: Array<{
        id: number
        name: string
    }>
}

export function MealPlannerContent({ meals, groceryLists }: MealPlannerContentProps) {
    const searchParams = useSearchParams()
    const [isNewMealOpen, setIsNewMealOpen] = useState(false)
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

    const updateQuery = useCallback(
        (
            updates: {
                search?: string
            },
            mode: 'push' | 'replace' = 'push'
        ) => {
            const params = new URLSearchParams(window.location.search)

            const nextSearch = updates.search !== undefined ? updates.search : searchValue

            if (nextSearch.trim() === '') {
                params.delete('search')
            } else {
                params.set('search', nextSearch)
            }

            params.delete('protein')
            params.delete('category')

            const nextQuery = params.toString()
            const nextUrl = nextQuery ? `?${nextQuery}` : window.location.pathname

            if (mode === 'push') {
                window.history.pushState(null, '', nextUrl)
            } else {
                window.history.replaceState(null, '', nextUrl)
            }
        },
        [searchValue]
    )

    const handleSearchChange = useCallback((nextValue: string) => {
        setSearchValue(nextValue)
        updateQuery({ search: nextValue }, 'replace')
    }, [updateQuery])

    const filteredMeals = useMemo(() => {
        const normalizedSearch = searchValue.trim().toLowerCase()
        return meals.filter((meal) => {
            return normalizedSearch.length === 0 ||
                meal.name.toLowerCase().includes(normalizedSearch)
        })
    }, [meals, searchValue])

    return (
        <div className="h-full flex flex-col md:flex-row">
            <div className="md:hidden border-b border-primary/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-app-text">Search meals</h2>
                    <button
                        type="button"
                        onClick={() => setIsNewMealOpen(true)}
                        className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-contrast hover:bg-primary-hover"
                    >
                        Add
                    </button>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={!searchValue}
                        onClick={() => handleSearchChange('')}
                        className="text-app-subtle hover:text-app-text/85 hover:bg-app-surface-soft/80 rounded-lg p-2 transition-colors disabled:text-app-subtle/60 disabled:hover:bg-transparent"
                        aria-label="Clear search"
                    >
                        X
                    </button>
                    <input
                        type="text"
                        placeholder="Search by name"
                        value={searchValue}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="flex-1 border border-app-border focus:border-primary focus:outline-none p-2 rounded-lg transition-colors bg-app-surface-raised/90 text-app-text text-base placeholder-app-subtle"
                    />
                </div>
            </div>

            <div className="hidden md:flex md:w-1/2 md:flex-col md:p-4">
                <div className="bg-app-surface p-6 rounded-xl shadow-lg border border-primary/30">
                    <h2 className="text-lg font-semibold text-primary-text mb-3">Add New Meal</h2>
                    <MealForm />
                </div>
            </div>

            <div className="flex-1 md:w-1/2 flex flex-col gap-3 p-4 overflow-hidden">
                <div className="hidden rounded-lg border border-primary/20 bg-app-surface p-3 md:block">
                    <div className="mb-2">
                        <h2 className="text-lg font-semibold text-app-text">Search meals</h2>
                        <p className="text-sm text-app-muted">Find a specific meal by name.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={!searchValue}
                            onClick={() => handleSearchChange('')}
                            className="text-app-subtle hover:text-app-text/85 hover:bg-app-surface-soft/80 rounded-lg p-2 transition-colors disabled:text-app-subtle/60 disabled:hover:bg-transparent"
                            aria-label="Clear search"
                        >
                            X
                        </button>
                        <input
                            type="text"
                            placeholder="Search by name"
                            value={searchValue}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="flex-1 border border-app-border focus:border-primary focus:outline-none p-2 rounded-lg transition-colors bg-app-surface-raised/90 text-app-text text-base placeholder-app-subtle"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredMeals.length > 0 ? (
                        <MealList meals={filteredMeals} groceryLists={groceryLists} variant="row" />
                    ) : (
                        <div className="h-full grid place-items-center text-app-subtle">
                            {meals.length === 0 ? 'No meals yet.' : 'No meals match your search.'}
                        </div>
                    )}
                </div>
            </div>

            <ResponsiveModal title="Add New Meal" isOpen={isNewMealOpen} onClose={() => setIsNewMealOpen(false)}>
                <MealForm onSuccess={() => setIsNewMealOpen(false)} />
            </ResponsiveModal>
        </div>
    )
}
