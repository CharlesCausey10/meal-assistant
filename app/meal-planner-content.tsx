'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { SerializedMealWithIngredients } from './utils/convert-prisma'
import { Filters } from './filters'
import { MealList } from './meal-list'
import { MealForm } from './components/meal-form'
import { ResponsiveModal } from './components/responsive-modal'

const NO_PROTEIN_FILTER = 'NO_PROTEIN'

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
    const [selectedProteins, setSelectedProteins] = useState<string[]>(
        searchParams.get('protein')?.split(',').filter(Boolean) || []
    )
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        searchParams.get('category')?.split(',').filter(Boolean) || []
    )

    const updateQuery = useCallback(
        (
            updates: {
                search?: string
                proteins?: string[]
                categories?: string[]
            },
            mode: 'push' | 'replace' = 'push'
        ) => {
            const params = new URLSearchParams(window.location.search)

            const nextSearch = updates.search !== undefined ? updates.search : searchValue
            const nextProteins = updates.proteins !== undefined ? updates.proteins : selectedProteins
            const nextCategories =
                updates.categories !== undefined ? updates.categories : selectedCategories

            if (nextSearch.trim() === '') {
                params.delete('search')
            } else {
                params.set('search', nextSearch)
            }

            if (nextProteins.length === 0) {
                params.delete('protein')
            } else {
                params.set('protein', nextProteins.join(','))
            }

            if (nextCategories.length === 0) {
                params.delete('category')
            } else {
                params.set('category', nextCategories.join(','))
            }

            const nextQuery = params.toString()
            const nextUrl = nextQuery ? `?${nextQuery}` : window.location.pathname

            if (mode === 'push') {
                window.history.pushState(null, '', nextUrl)
            } else {
                window.history.replaceState(null, '', nextUrl)
            }
        },
        [searchValue, selectedProteins, selectedCategories]
    )

    const handleSearchChange = useCallback((nextValue: string) => {
        setSearchValue(nextValue)
        updateQuery({ search: nextValue }, 'replace')
    }, [updateQuery])

    const handleProteinsChange = useCallback((nextProteins: string[]) => {
        setSelectedProteins(nextProteins)
        updateQuery({ proteins: nextProteins }, 'push')
    }, [updateQuery])

    const handleCategoriesChange = useCallback((nextCategories: string[]) => {
        setSelectedCategories(nextCategories)
        updateQuery({ categories: nextCategories }, 'push')
    }, [updateQuery])

    const isProteinMatch = useCallback(
        (protein: string | null) => {
            if (selectedProteins.length === 0) {
                return true
            }

            if (protein === null) {
                return selectedProteins.includes(NO_PROTEIN_FILTER)
            }

            return selectedProteins.includes(protein)
        },
        [selectedProteins]
    )

    const isCategoryMatch = useCallback(
        (category: string) => {
            if (selectedCategories.length === 0) {
                return true
            }

            return selectedCategories.includes(category)
        },
        [selectedCategories]
    )

    const filteredMeals = useMemo(() => {
        const normalizedSearch = searchValue.trim().toLowerCase()
        return meals.filter((meal) => {
            const isSearchMatch =
                normalizedSearch.length === 0 ||
                meal.name.toLowerCase().includes(normalizedSearch)

            return isSearchMatch && isProteinMatch(meal.protein) && isCategoryMatch(meal.category)
        })
    }, [meals, searchValue, isProteinMatch, isCategoryMatch])

    return (
        <div className="h-full flex flex-col md:flex-row">
            <div className="md:hidden p-3 border-b border-purple-500/20 flex gap-2">
                <button
                    type="button"
                    disabled={!searchValue}
                    onClick={() => handleSearchChange('')}
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg p-2 transition-colors disabled:text-slate-600 disabled:hover:bg-transparent"
                    aria-label="Clear search"
                >
                    ✕
                </button>
                <input
                    type="text"
                    placeholder="Search meals..."
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="flex-1 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-base placeholder-slate-400"
                />
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
                <Filters
                    searchValue={searchValue}
                    onSearchChange={handleSearchChange}
                    selectedProteins={selectedProteins}
                    onProteinsChange={handleProteinsChange}
                    selectedCategories={selectedCategories}
                    onCategoriesChange={handleCategoriesChange}
                />
                {/* </div> */}
                <div className="flex-1 overflow-y-auto">
                    {filteredMeals.length > 0 ? (
                        <MealList meals={filteredMeals} groceryLists={groceryLists} />
                    ) : (
                        <div className="h-full grid place-items-center text-slate-400">
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
