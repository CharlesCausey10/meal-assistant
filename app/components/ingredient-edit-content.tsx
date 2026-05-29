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
    const [searchQuery, setSearchQuery] = useState('')

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

    const normalizedSearchQuery = searchQuery.trim().toLowerCase()
    const filteredIngredients = normalizedSearchQuery
        ? ingredients.filter((ingredient) =>
              ingredient.name.toLowerCase().includes(normalizedSearchQuery)
          )
        : ingredients

    const groupedIngredients = ingredientCategories.reduce(
        (acc, category) => {
            acc[category] = filteredIngredients.filter((ing) => ing.category === category)
            return acc
        },
        {} as Record<IngredientCategory, Ingredient[]>
    )

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 p-4 sm:p-6 border-b border-app-border">
                <h2 className="text-2xl font-bold text-app-text mb-4">✏️ Edit Ingredients</h2>

                {isCreating ? (
                    <form action={handleCreate} className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                name="name"
                                placeholder="Ingredient name"
                                value={newIngredientName}
                                onChange={(e) => setNewIngredientName(e.target.value)}
                                className="flex-1 border border-app-border focus:border-primary focus:outline-none p-2 rounded-lg bg-app-surface-raised/90 text-app-text"
                                autoFocus
                                required
                            />
                            <select
                                name="category"
                                value={newIngredientCategory}
                                onChange={(e) =>
                                    setNewIngredientCategory(e.target.value as IngredientCategory)
                                }
                                className="border border-app-border focus:border-primary focus:outline-none p-2 rounded-lg bg-app-surface-raised/90 text-app-text"
                            >
                                {ingredientCategories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {formatLabel(cat)}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="submit"
                                className="bg-linear-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-primary-contrast px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap"
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
                            className="text-app-subtle hover:text-app-muted text-sm"
                        >
                            Cancel
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-linear-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-primary-contrast px-4 py-2 rounded-lg font-medium transition-all"
                    >
                        + Add Ingredient
                    </button>
                )}

                <div className="mt-4">
                    <input
                        type="search"
                        placeholder="Search ingredients..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full border border-app-border focus:border-primary focus:outline-none p-2 rounded-lg bg-app-surface-raised/90 text-app-text"
                        aria-label="Search ingredients"
                    />
                </div>
            </div>

            {/* Ingredients List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {filteredIngredients.length === 0 ? (
                    <div className="h-full grid place-items-center text-app-subtle">
                        {ingredients.length === 0
                            ? 'No ingredients yet.'
                            : 'No ingredients match your search.'}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {ingredientCategories.map((category) => {
                            const categoryIngredients = groupedIngredients[category]
                            if (categoryIngredients.length === 0) return null

                            return (
                                <div key={category} className="space-y-2">
                                    <h3 className="text-lg font-semibold text-primary-text">
                                        {formatLabel(category)}
                                    </h3>
                                    <ul className="space-y-1">
                                        {categoryIngredients.map((ingredient) => (
                                            <li key={ingredient.id}>
                                                {editingId === ingredient.id ? (
                                                    <form
                                                        action={handleEditSubmit}
                                                        className="flex flex-col gap-2 bg-app-surface/95 p-3 rounded-lg border border-primary/50"
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
                                                                className="flex-1 border border-app-border focus:border-primary focus:outline-none p-2 rounded bg-app-surface-raised/90 text-app-text"
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
                                                                className="border border-app-border focus:border-primary focus:outline-none p-2 rounded bg-app-surface-raised/90 text-app-text"
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
                                                                className="flex-1 bg-linear-to-r from-info to-info-hover hover:from-info-hover hover:to-info-hover text-primary-contrast px-3 py-2 rounded text-sm font-medium transition-all"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleEditCancel}
                                                                className="flex-1 bg-app-surface-soft hover:bg-app-border-strong text-primary-contrast px-3 py-2 rounded text-sm font-medium transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <div className="flex items-center justify-between bg-app-surface/80 p-3 rounded-lg border border-app-border hover:border-app-border transition-colors">
                                                        <span className="text-app-text/85">
                                                            {ingredient.name}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEditStart(ingredient)}
                                                                className="text-info hover:text-info-hover hover:bg-app-surface-soft/80 rounded-lg px-3 py-1 text-sm transition-colors"
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
                                                                    className="text-danger hover:text-danger-hover hover:bg-app-surface-soft/80 rounded-lg px-3 py-1 text-sm transition-colors"
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
