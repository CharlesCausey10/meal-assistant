'use client'

import { useState } from 'react'
import { deleteMeal, updateMeal } from './actions'
import { PreferenceInput } from './components/preference-input'
import { IngredientInput } from './components/ingredient-input'
import { MealLogForm } from './components/meal-log-form'
import { ResponsiveModal } from './components/responsive-modal'
import { CookingAnimation } from './components/cooking-animation'
import type { Meal, MealIngredient, Ingredient } from '@prisma/client'

type MealWithIngredients = Meal & {
    ingredients: Array<MealIngredient & { ingredient: Ingredient }>
}

interface IngredientWithQuantity extends Ingredient {
    quantity: number
    unit: string
}

export function MealList({ meals }: { meals: MealWithIngredients[] }) {
    const [editingId, setEditingId] = useState<number | null>(null)
    const [loggingMealId, setLoggingMealId] = useState<number | null>(null)
    const [editingIngredients, setEditingIngredients] = useState<IngredientWithQuantity[]>([])


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
                        <div className="flex justify-between items-center w-full gap-2">
                            <button 
                                    onClick={() => setLoggingMealId(meal.id)}
                                    className="group text-xl hover:bg-slate-700/50 rounded-lg p-2 transition-colors"
                                    aria-label="Log this meal as cooked"
                                    title="Cook"
                                >
                                    <CookingAnimation hoverOnly />
                                </button>
                            <div className="flex-1">
                                <div className="font-semibold text-slate-100 text-lg">{meal.name}</div>
                                <div className="text-sm text-purple-300">
                                    {meal.protein ? getProteinEmoji(meal.protein) + ' ' + formatProtein(meal.protein) + ' • ' : ''}{formatCategory(meal.category)}
                                    {meal.preference && <span className="ml-2 text-xs text-slate-400">({meal.preference}/10)</span>}
                                </div>
                                {meal.ingredients.length > 0 && (
                                    <div className="text-xs text-slate-400 mt-2 space-y-1">
                                        {meal.ingredients.map(ing => (
                                            <div key={ing.id}>{String(ing.quantity)} {ing.unit} {ing.ingredient.name}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        setEditingId(meal.id)
                                        setEditingIngredients(meal.ingredients.map(ing => ({
                                            ...ing.ingredient,
                                            quantity: Number(ing.quantity),
                                            unit: ing.unit,
                                        })))
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
