'use client'

import { useState } from 'react'
import { createIngredient, deleteIngredient, updateIngredient } from '../actions-ingredients'
import type { Ingredient, IngredientCategory } from '@prisma/client'
import { formatLabel } from '../utils/format'

type IngredientEditContentProps = {
    ingredients: Ingredient[]
    ingredientCategories: IngredientCategory[]
}

export function IngredientEditContent({
    ingredients,
    ingredientCategories,
}: IngredientEditContentProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [newIngredientName, setNewIngredientName] = useState('')
    const [newIngredientCategory, setNewIngredientCategory] = useState<IngredientCategory>(
        'OTHER'
    )
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editName, setEditName] = useState('')
    const [editCategory, setEditCategory] = useState<IngredientCategory>('OTHER')

    const handleCreate = async (formData: FormData) => {
        await createIngredient(formData)
        setNewIngredientName('')
        setNewIngredientCategory('OTHER')
        setIsCreating(false)
    }

    const handleEditStart = (ingredient: Ingredient) => {
        setEditingId(ingredient.id)
        setEditName(ingredient.name)
        setEditCategory(ingredient.category)
    }

    const handleEditCancel = () => {
        setEditingId(null)
        setEditName('')
        setEditCategory('OTHER')
    }

    const handleEditSubmit = async (formData: FormData) => {
        await updateIngredient(formData)
        handleEditCancel()
    }

    const groupedIngredients = ingredientCategories.reduce(
        (acc, category) => {
            acc[category] = ingredients.filter((ing) => ing.category === category)
            return acc
        },
        {} as Record<IngredientCategory, Ingredient[]>
    )

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold text-slate-100 mb-4">✏️ Edit Ingredients</h2>

                {isCreating ? (
                    <form action={handleCreate} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                name="name"
                                placeholder="Ingredient name"
                                value={newIngredientName}
                                onChange={(e) => setNewIngredientName(e.target.value)}
                                className="flex-1 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded-lg bg-slate-900/80 text-slate-100"
                                autoFocus
                                required
                            />
                            <select
                                name="category"
                                value={newIngredientCategory}
                                onChange={(e) =>
                                    setNewIngredientCategory(e.target.value as IngredientCategory)
                                }
                                className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded-lg bg-slate-900/80 text-slate-100"
                            >
                                {ingredientCategories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {formatLabel(cat)}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                className="bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap"
                            >
                                Add
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreating(false)
                                setNewIngredientName('')
                                setNewIngredientCategory('OTHER')
                            }}
                            className="text-slate-400 hover:text-slate-300 text-sm"
                        >
                            Cancel
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                    >
                        + Add Ingredient
                    </button>
                )}
            </div>

            {/* Ingredients List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {ingredients.length === 0 ? (
                    <div className="h-full grid place-items-center text-slate-400">
                        No ingredients yet.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {ingredientCategories.map((category) => {
                            const categoryIngredients = groupedIngredients[category]
                            if (categoryIngredients.length === 0) return null

                            return (
                                <div key={category} className="space-y-2">
                                    <h3 className="text-lg font-semibold text-purple-300">
                                        {formatLabel(category)}
                                    </h3>
                                    <ul className="space-y-1">
                                        {categoryIngredients.map((ingredient) => (
                                            <li key={ingredient.id}>
                                                {editingId === ingredient.id ? (
                                                    <form
                                                        action={handleEditSubmit}
                                                        className="flex flex-col gap-2 bg-slate-800/80 p-3 rounded-lg border border-purple-500/50"
                                                    >
                                                        <input
                                                            type="hidden"
                                                            name="id"
                                                            value={ingredient.id}
                                                        />
                                                        <div className="flex flex-col sm:flex-row gap-2">
                                                            <input
                                                                type="text"
                                                                name="name"
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                className="flex-1 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                                                                required
                                                                autoFocus
                                                            />
                                                            <select
                                                                name="category"
                                                                value={editCategory}
                                                                onChange={(e) =>
                                                                    setEditCategory(
                                                                        e.target.value as IngredientCategory
                                                                    )
                                                                }
                                                                className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                                                            >
                                                                {ingredientCategories.map((cat) => (
                                                                    <option key={cat} value={cat}>
                                                                        {formatLabel(cat)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="submit"
                                                                className="flex-1 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-all"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleEditCancel}
                                                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm font-medium transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                                                        <span className="text-slate-200">
                                                            {ingredient.name}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEditStart(ingredient)}
                                                                className="text-indigo-400 hover:text-indigo-300 hover:bg-slate-700/50 rounded-lg px-3 py-1 text-sm transition-colors"
                                                                aria-label={`Edit ${ingredient.name}`}
                                                            >
                                                                Edit
                                                            </button>
                                                            <form action={deleteIngredient}>
                                                                <input
                                                                    type="hidden"
                                                                    name="id"
                                                                    value={ingredient.id}
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    className="text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded-lg px-3 py-1 text-sm transition-colors"
                                                                    aria-label={`Delete ${ingredient.name}`}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
