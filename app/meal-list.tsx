'use client'

import { useState } from 'react'
import { deleteMeal, updateMeal } from './actions'
import { PreferenceInput } from './components/preference-input'
import { MealLogForm } from './components/meal-log-form'
import type { Meal } from '@prisma/client'

export function MealList({ meals }: { meals: Meal[] }) {
    const [editingId, setEditingId] = useState<number | null>(null)
    const [loggingMealId, setLoggingMealId] = useState<number | null>(null)

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
                        <form action={updateMeal} onSubmit={() => setEditingId(null)} className="space-y-3">
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
                            <div className="flex gap-2">
                                <button 
                                    type="submit"
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                >
                                    Save
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setEditingId(null)}
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
                                    className="text-xl hover:bg-slate-700/50 rounded-lg p-2 transition-colors"
                                    aria-label="Log this meal as cooked"
                                    title="Cook"
                                >
                                    🍳
                                </button>
                            <div className="flex-1">
                                <div className="font-semibold text-slate-100 text-lg">{meal.name}</div>
                                <div className="text-sm text-purple-300">
                                    {meal.protein ? getProteinEmoji(meal.protein) + ' ' + formatProtein(meal.protein) + ' • ' : ''}{formatCategory(meal.category)}
                                    {meal.preference && <span className="ml-2 text-xs text-slate-400">({meal.preference}/10)</span>}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setEditingId(meal.id)}
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

        {/* Log Meal Modal */}
        {loggingMealId !== null && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-slate-900 rounded-xl shadow-2xl border border-purple-500/30 p-6 max-w-md w-full mx-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-100">Log Cooked Meal</h3>
                        <button 
                            onClick={() => setLoggingMealId(null)}
                            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg p-2 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <MealLogForm 
                        defaultName={meals.find(m => m.id === loggingMealId)?.name || ''}
                        defaultProtein={meals.find(m => m.id === loggingMealId)?.protein || ''}
                        onSuccess={() => setLoggingMealId(null)}
                    />
                </div>
            </div>
        )}
        </>
    )
}
