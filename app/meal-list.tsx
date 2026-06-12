'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { deleteMeal, updateMeal } from './actions'
import { addMealToGroceryList } from './actions-grocery'
import { PreferenceInput } from './components/preference-input'
import { IngredientInput } from './components/ingredient-input'
import { CategoryCheckboxGroup } from './components/category-checkbox-group'
import { MealLogForm } from './components/meal-log-form'
import { ResponsiveModal } from './components/responsive-modal'
import { CookingAnimation } from './components/cooking-animation'
import { Toast } from './components/toast'
import type { Ingredient } from '@prisma/client'
import type { SerializedMealWithIngredients } from './utils/convert-prisma'
import { getMealCategoriesForDisplay, getMealCategoryLabel } from './utils/categories'

interface IngredientWithQuantity extends Ingredient {
    quantity: number
    unit: string
}

type MealListProps = {
    meals: SerializedMealWithIngredients[]
    groceryLists: Array<{
        id: number
        name: string
    }>
}

export function MealList({ meals, groceryLists }: MealListProps) {
    const [editingId, setEditingId] = useState<number | null>(null)
    const [loggingMealId, setLoggingMealId] = useState<number | null>(null)
    const [addingToListMealId, setAddingToListMealId] = useState<number | null>(null)
    const [toastMessage, setToastMessage] = useState<string | null>(null)
    const [editingIngredients, setEditingIngredients] = useState<IngredientWithQuantity[]>([])
    const [expandedIngredients, setExpandedIngredients] = useState<Set<number>>(new Set())


    const getProteinEmoji = (protein: string) => {
        const emojiMap: Record<string, string> = {
            'CHICKEN_BREAST': '🐔',
            'CHICKEN_THIGHS': '🐔',
            'ROTISSERIE_CHICKEN': '🐔',
            'GROUND_BEEF': '🐄',
            'PORK_BUTT': '🐷',
            'FISH': '🐟',
            'EGGS': '🥚'
        }
        return emojiMap[protein] || ''
    }

    const formatProtein = (protein: string) => {
        return protein.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
    }

    const formatLastCooked = (isoDate: string) => {
        const cookedAt = new Date(isoDate)
        return cookedAt.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const selectedAddToListMeal = meals.find((meal) => meal.id === addingToListMealId) || null

    useEffect(() => {
        if (!toastMessage) {
            return
        }

        const timeout = setTimeout(() => {
            setToastMessage(null)
        }, 2800)

        return () => clearTimeout(timeout)
    }, [toastMessage])

    return (
        <>
            <ul className="space-y-3">
                {meals.map(meal => (
                    <li key={meal.id} className="bg-app-surface/80 backdrop-blur-sm border border-primary/20 p-4 rounded-xl hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40 transition-all">
                        {editingId === meal.id ? (
                            <form onSubmit={(e) => {
                                e.preventDefault()
                                const form = e.currentTarget
                                const formData = new FormData(form)
                                formData.append('ingredients', JSON.stringify(editingIngredients))
                                updateMeal(formData).then(() => {
                                    setEditingId(null)
                                    setEditingIngredients([])
                                })
                            }} className="space-y-3">
                                <input type="hidden" name="id" value={meal.id} />
                                <input
                                    name="name"
                                    defaultValue={meal.name}
                                    placeholder="Meal name"
                                    className="border border-app-border focus:border-primary focus:outline-none p-2 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text text-base"
                                    required
                                />
                                <input
                                    name="recipeUrl"
                                    defaultValue={meal.recipeUrl || ''}
                                    placeholder="Recipe URL (optional)"
                                    type="url"
                                    className="border border-app-border focus:border-primary focus:outline-none p-2 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text text-base"
                                />
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <select
                                        name="protein"
                                        defaultValue={meal.protein || ''}
                                        className="border border-app-border focus:border-primary focus:outline-none p-2 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text text-base"
                                    >
                                        <option value="">Protein (optional)</option>
                                        <option value="CHICKEN_BREAST">🐔 Chicken Breast</option>
                                        <option value="CHICKEN_THIGHS">🐔 Chicken Thighs</option>
                                        <option value="ROTISSERIE_CHICKEN">🐔 Rotisserie Chicken</option>
                                        <option value="GROUND_BEEF">🐄 Ground Beef</option>
                                        <option value="PORK_BUTT">🐷 Pork Butt</option>
                                        <option value="FISH">🐟 Fish</option>
                                        <option value="EGGS">🥚 Eggs</option>
                                    </select>
                                    <PreferenceInput defaultValue={meal.preference || ''} padSize="sm" />
                                </div>
                                <CategoryCheckboxGroup
                                    defaultCategories={meal.categories.length > 0 ? meal.categories : [meal.category]}
                                    compact
                                />
                                <IngredientInput
                                    onIngredientsChange={setEditingIngredients}
                                    initialIngredients={meal.ingredients.map(ing => ({
                                        ingredient: ing.ingredient,
                                        quantity: Number(ing.quantity),
                                        unit: ing.unit,
                                    }))}
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="bg-linear-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-primary-contrast px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null)
                                            setEditingIngredients([])
                                        }}
                                        className="bg-app-surface-soft hover:bg-app-border-strong text-app-text/85 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3">

                                {/* Title Row */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-app-text text-lg">{meal.name}</div>

                                        <div className="text-sm text-primary-text">
                                            {`${meal.protein ? getProteinEmoji(meal.protein) + ' ' : ''}${meal.protein ? formatProtein(meal.protein) + ' / ' : ''}${getMealCategoriesForDisplay(meal).map(getMealCategoryLabel).join(' / ')}`}

                                            {meal.preference && (
                                                <span className="ml-2 text-xs text-app-subtle">
                                                    {meal.preference}/10
                                                </span>
                                            )}
                                        </div>
                                        {meal.lastCookedAt && (
                                            <div className="text-xs text-app-subtle mt-1">
                                                Last cooked: {formatLastCooked(meal.lastCookedAt)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Kebab Menu */}
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => {
                                                setEditingId(meal.id)
                                                setEditingIngredients(
                                                    meal.ingredients.map(ing => ({
                                                        ...ing.ingredient,
                                                        quantity: Number(ing.quantity),
                                                        unit: ing.unit,
                                                    }))
                                                )
                                            }}
                                            className="text-primary hover:text-primary-text hover:bg-app-surface-soft/80 rounded-lg p-2 transition-colors"
                                            aria-label="Edit meal"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>

                                        <form action={deleteMeal}>
                                            <input type="hidden" name="id" value={meal.id} />
                                            <button
                                                type="submit"
                                                className="text-danger hover:text-danger-hover hover:bg-app-surface-soft/80 rounded-lg p-2 transition-colors"
                                                aria-label="Delete meal"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* Recipe Link */}
                                {meal.recipeUrl && (
                                    <a
                                        href={meal.recipeUrl}
                                        target="_blank"
                                        className="flex items-center gap-2 text-info hover:text-info-hover transition-colors"
                                    >
                                        📖 View Recipe →
                                    </a>
                                )}

                                {/* Ingredient Dropdown */}
                                {meal.ingredients.length > 0 && (
                                    <div className="bg-app-surface-soft/70 rounded-lg border border-app-border/60">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newExpanded = new Set(expandedIngredients)
                                                if (newExpanded.has(meal.id)) {
                                                    newExpanded.delete(meal.id)
                                                } else {
                                                    newExpanded.add(meal.id)
                                                }
                                                setExpandedIngredients(newExpanded)
                                            }}
                                            className="w-full flex justify-between items-center px-3 py-2 text-sm text-app-text/85 hover:bg-app-surface-soft/80 rounded-lg"
                                        >
                                            <span>
                                                {expandedIngredients.has(meal.id) ? '▾' : '▸'} Ingredients ({meal.ingredients.length})
                                            </span>
                                        </button>

                                        {expandedIngredients.has(meal.id) && (
                                            <div className="px-4 pb-3 text-sm text-app-muted space-y-1">
                                                {meal.ingredients.map(ing => (
                                                    <div key={ing.id}>
                                                        • {String(ing.quantity)} {ing.unit} {ing.ingredient.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        onClick={() => setLoggingMealId(meal.id)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-primary-contrast py-3 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20"
                                    >
                                        <CookingAnimation hoverOnly />
                                        Cook
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAddingToListMealId(meal.id)}
                                        className="shrink-0 bg-app-surface-soft hover:bg-app-border-strong text-app-text px-4 py-3 rounded-xl font-semibold transition-colors border border-app-border"
                                    >
                                        Add to List
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            <ResponsiveModal title="Cook Meal" isOpen={loggingMealId !== null} onClose={() => setLoggingMealId(null)}>
                <MealLogForm
                    mealId={loggingMealId ?? undefined}
                    defaultName={meals.find(m => m.id === loggingMealId)?.name || ''}
                    defaultProtein={meals.find(m => m.id === loggingMealId)?.protein || ''}
                    onSuccess={() => setLoggingMealId(null)}
                />
            </ResponsiveModal>

            <ResponsiveModal
                title="Add to Grocery List"
                isOpen={addingToListMealId !== null}
                onClose={() => setAddingToListMealId(null)}
                position="top"
            >
                {selectedAddToListMeal ? (
                    <div className="space-y-3">
                        <p className="text-sm text-app-muted">
                            Add <span className="font-semibold text-app-text">{selectedAddToListMeal.name}</span> to:
                        </p>

                        {groceryLists.length === 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm text-app-subtle">No grocery lists yet.</p>
                                <Link
                                    href="/?tab=grocery"
                                    className="inline-block text-sm text-primary-text hover:text-primary-text"
                                >
                                    Go to Grocery tab to create one
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {groceryLists.map((list) => (
                                    <form
                                        key={list.id}
                                        action={async (formData) => {
                                            await addMealToGroceryList(formData)
                                            setToastMessage(
                                                `Added ${selectedAddToListMeal.name} to ${list.name}`
                                            )
                                            setAddingToListMealId(null)
                                        }}
                                    >
                                        <input type="hidden" name="mealId" value={selectedAddToListMeal.id} />
                                        <input type="hidden" name="groceryListId" value={list.id} />
                                        <button
                                            type="submit"
                                            className="w-full text-left p-3 bg-app-surface/90 hover:bg-app-surface-soft/70 rounded-lg text-app-text transition-colors border border-app-border"
                                        >
                                            {list.name}
                                        </button>
                                    </form>
                                ))}
                            </div>
                        )}
                    </div>
                ) : null}
            </ResponsiveModal>

            {toastMessage ? (
                <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
            ) : null}
        </>
    )
}
