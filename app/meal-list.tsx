'use client'

import { useState } from 'react'
import { deleteMeal, updateMeal } from './actions'
import { PreferenceInput } from './components/preference-input'
import { IngredientInput } from './components/ingredient-input'
import { MealLogForm } from './components/meal-log-form'
import { ResponsiveModal } from './components/responsive-modal'
import { CookingAnimation } from './components/cooking-animation'
import type { Ingredient } from '@prisma/client'
import type { SerializedMealWithIngredients } from './utils/convert-prisma'

interface IngredientWithQuantity extends Ingredient {
    quantity: number
    unit: string
}

export function MealList({ meals }: { meals: SerializedMealWithIngredients[] }) {
    const [editingId, setEditingId] = useState<number | null>(null)
    const [loggingMealId, setLoggingMealId] = useState<number | null>(null)
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
                                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-sm"
                                    required
                                />
                                <input
                                    name="recipeUrl"
                                    defaultValue={meal.recipeUrl || ''}
                                    placeholder="Recipe URL (optional)"
                                    type="url"
                                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-sm"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        name="protein"
                                        defaultValue={meal.protein || ''}
                                        className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-sm"
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
                                        className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 text-sm"
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
                                            ✏️
                                        </button>

                                        <form action={deleteMeal}>
                                            <input type="hidden" name="id" value={meal.id} />
                                            <button
                                                type="submit"
                                                className="text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded-lg p-2 transition-colors"
                                                aria-label="Delete meal"
                                            >
                                                ❌
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

                                {/* Cook Button */}
                                <button
                                    onClick={() => setLoggingMealId(meal.id)}
                                    className="w-full flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20"
                                >
                                    <CookingAnimation hoverOnly />
                                    Cook
                                </button>
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
        </>
    )
}
