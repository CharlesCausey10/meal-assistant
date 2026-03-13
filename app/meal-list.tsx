'use client'

import { useEffect, useState } from 'react'
import { deleteMeal, updateMeal } from './actions'
import { addMealToGroceryList } from './actions-grocery'
import { PreferenceInput } from './components/preference-input'
import { IngredientInput } from './components/ingredient-input'
import { MealLogForm } from './components/meal-log-form'
import { ResponsiveModal } from './components/responsive-modal'
import { CookingAnimation } from './components/cooking-animation'
import { Toast } from './components/toast'
import type { Ingredient } from '@prisma/client'
import type { SerializedMealWithIngredients } from './utils/convert-prisma'

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

    const formatCategory = (category: string) => {
        if (category === 'SIDE_STARTER') return 'Side/Starter'
        return category.charAt(0) + category.slice(1).toLowerCase()
    }

    const formatProtein = (protein: string) => {
        return protein.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
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
                    <li key={meal.id} className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 p-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/40 transition-all">
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
                                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-base"
                                    required
                                />
                                <input
                                    name="recipeUrl"
                                    defaultValue={meal.recipeUrl || ''}
                                    placeholder="Recipe URL (optional)"
                                    type="url"
                                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-base"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        name="protein"
                                        defaultValue={meal.protein || ''}
                                        className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-base"
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
                                    <select
                                        name="category"
                                        defaultValue={meal.category}
                                        className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-base"
                                        required
                                    >
                                        <option value="BREAKFAST">Breakfast</option>
                                        <option value="LUNCH">Lunch</option>
                                        <option value="DINNER">Dinner</option>
                                        <option value="SIDE_STARTER">Side/Starter</option>
                                        <option value="SNACK">Snack</option>
                                        <option value="DESSERT">Dessert</option>
                                    </select>
                                    <PreferenceInput defaultValue={meal.preference || ''} padSize="sm" />
                                </div>
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
                                        className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null)
                                            setEditingIngredients([])
                                        }}
                                        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-all"
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
                                        <div className="font-semibold text-slate-100 text-lg">{meal.name}</div>

                                        <div className="text-sm text-purple-300">
                                            {`${meal.protein ? getProteinEmoji(meal.protein) + ' ' : ''}${meal.protein ? formatProtein(meal.protein) + ' • ' : ''}${formatCategory(meal.category)}`}

                                            {meal.preference && (
                                                <span className="ml-2 text-xs text-slate-400">
                                                    {meal.preference}/10
                                                </span>
                                            )}
                                        </div>
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
                                            className="text-purple-400 hover:text-purple-300 hover:bg-slate-700/50 rounded-lg p-2 transition-colors"
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
                                                className="text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded-lg p-2 transition-colors"
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
                                        className="flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-colors"
                                    >
                                        📖 View Recipe →
                                    </a>
                                )}

                                {/* Ingredient Dropdown */}
                                {meal.ingredients.length > 0 && (
                                    <div className="bg-slate-700/40 rounded-lg border border-slate-600/40">
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
                                            className="w-full flex justify-between items-center px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 rounded-lg"
                                        >
                                            <span>
                                                {expandedIngredients.has(meal.id) ? '▾' : '▸'} Ingredients ({meal.ingredients.length})
                                            </span>
                                        </button>

                                        {expandedIngredients.has(meal.id) && (
                                            <div className="px-4 pb-3 text-sm text-slate-300 space-y-1">
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
                                        className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20"
                                    >
                                        <CookingAnimation hoverOnly />
                                        Cook
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAddingToListMealId(meal.id)}
                                        className="shrink-0 bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-3 rounded-xl font-semibold transition-colors border border-slate-600"
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
                        <p className="text-sm text-slate-300">
                            Add <span className="font-semibold text-slate-100">{selectedAddToListMeal.name}</span> to:
                        </p>

                        {groceryLists.length === 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-400">No grocery lists yet.</p>
                                <a
                                    href="/?tab=grocery"
                                    className="inline-block text-sm text-purple-300 hover:text-purple-200"
                                >
                                    Go to Grocery tab to create one
                                </a>
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
                                            className="w-full text-left p-3 bg-slate-800/70 hover:bg-slate-700/70 rounded-lg text-slate-100 transition-colors border border-slate-600"
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
