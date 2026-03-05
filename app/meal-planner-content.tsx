'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Meal, MealIngredient, Ingredient } from '@prisma/client'
import { Filters } from './filters'
import { MealList } from './meal-list'
import { MealForm } from './components/meal-form'
import { ResponsiveModal } from './components/responsive-modal'

type MealWithIngredients = Meal & {
    ingredients: Array<MealIngredient & { ingredient: Ingredient }>
}

export function MealPlannerContent({ meals }: { meals: MealWithIngredients[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isNewMealOpen, setIsNewMealOpen] = useState(false)
    const [mobileSearchValue, setMobileSearchValue] = useState(searchParams.get('search') || '')
    const [, startTransition] = useTransition()

    const updateUrlAndRefresh = useCallback((params: URLSearchParams, mode: 'push' | 'replace' = 'push') => {
        const nextQuery = params.toString()
        const nextUrl = nextQuery ? `?${nextQuery}` : window.location.pathname

        if (mode === 'push') {
            window.history.pushState(null, '', nextUrl)
        } else {
            window.history.replaceState(null, '', nextUrl)
        }

        startTransition(() => {
            router.refresh()
        })
    }, [router, startTransition])

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(window.location.search)
            const currentSearch = params.get('search') || ''

            if (mobileSearchValue === currentSearch) {
                return
            }

            if (mobileSearchValue === '') {
                params.delete('search')
            } else {
                params.set('search', mobileSearchValue)
            }

            updateUrlAndRefresh(params, 'replace')
        }, 300)

        return () => clearTimeout(timer)
    }, [mobileSearchValue, updateUrlAndRefresh])

    return (
        <div className="h-full flex flex-col md:flex-row">
            <div className="md:hidden p-3 border-b border-purple-500/20 flex gap-2">
                <button
                    type="button"
                    disabled={!mobileSearchValue}
                    onClick={() => setMobileSearchValue('')}
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg p-2 transition-colors disabled:text-slate-600 disabled:hover:bg-transparent"
                    aria-label="Clear search"
                >
                    ✕
                </button>
                <input
                    type="text"
                    placeholder="Search meals..."
                    value={mobileSearchValue}
                    onChange={(e) => setMobileSearchValue(e.target.value)}
                    className="flex-1 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-sm placeholder-slate-400"
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
                <Filters />
                {/* </div> */}
                <div className="flex-1 overflow-y-auto">
                    <MealList meals={meals} />
                </div>
            </div>

            <ResponsiveModal title="Add New Meal" isOpen={isNewMealOpen} onClose={() => setIsNewMealOpen(false)}>
                <MealForm onSuccess={() => setIsNewMealOpen(false)} />
            </ResponsiveModal>
        </div>
    )
}
