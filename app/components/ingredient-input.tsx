'use client'

import { useState, useEffect } from 'react'
import type { Ingredient } from '@prisma/client'

interface IngredientWithQuantity extends Ingredient {
    quantity: number
    unit: string
}

interface IngredientInputProps {
    onIngredientsChange: (ingredients: IngredientWithQuantity[]) => void
    initialIngredients?: Array<{
        ingredient: Ingredient
        quantity: number
        unit: string
    }>
}

export function IngredientInput({ onIngredientsChange, initialIngredients = [] }: IngredientInputProps) {
    const [ingredients, setIngredients] = useState<IngredientWithQuantity[]>(
        initialIngredients.map(ing => ({
            ...ing.ingredient,
            quantity: ing.quantity,
            unit: ing.unit,
        }))
    )
    const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
    const [newIngredientName, setNewIngredientName] = useState('')
    const [newQuantity, setNewQuantity] = useState('')
    const [newUnit, setNewUnit] = useState('cup')
    const [newCategory, setNewCategory] = useState('PRODUCE')

    useEffect(() => {
        // Fetch available ingredients
        fetch('/api/ingredients')
            .then(res => res.json())
            .then(data => setAvailableIngredients(data))
            .catch(err => console.error('Failed to fetch ingredients:', err))
    }, [])

    useEffect(() => {
        onIngredientsChange(ingredients)
    }, [ingredients, onIngredientsChange])

    const handleAddIngredient = async () => {
        if (!newIngredientName || !newQuantity) return

        let ingredient = availableIngredients.find(i => i.name.toLowerCase() === newIngredientName.toLowerCase())

        // Create new ingredient if it doesn't exist
        if (!ingredient) {
            try {
                const res = await fetch('/api/ingredients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: newIngredientName,
                        category: newCategory,
                    }),
                })
                const newIngredient = await res.json()
                if (newIngredient) {
                    ingredient = newIngredient
                    setAvailableIngredients([...availableIngredients, newIngredient])
                }
            } catch (err) {
                console.error('Failed to create ingredient:', err)
                return
            }
        }

        // Add to meal's ingredients
        if (ingredient) {
            setIngredients([
                ...ingredients,
                {
                    id: ingredient.id,
                    name: ingredient.name,
                    category: ingredient.category,
                    createdAt: ingredient.createdAt,
                    quantity: parseFloat(newQuantity),
                    unit: newUnit,
                }
            ])
        }

        // Reset form
        setNewIngredientName('')
        setNewQuantity('')
        setNewUnit('cup')
        setNewCategory('PRODUCE')
    }

    const handleRemoveIngredient = (id: number) => {
        setIngredients(ingredients.filter(ing => ing.id !== id))
    }

    const commonUnits = ['tsp', 'tbsp', 'cup', 'oz', 'lb', 'g', 'ml', 'l', 'whole', 'piece']

    return (
        <div className="space-y-3 border border-slate-600 p-4 rounded-lg bg-slate-900/50">
            <h3 className="text-sm font-semibold text-slate-200">Ingredients</h3>

            {/* Ingredient list */}
            {ingredients.length > 0 && (
                <div className="space-y-2 bg-slate-800/50 p-3 rounded">
                    {ingredients.map(ing => (
                        <div key={ing.id} className="flex justify-between items-center text-sm text-slate-300 bg-slate-900/50 p-2 rounded">
                            <span>{ing.quantity} {ing.unit} {ing.name}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveIngredient(ing.id)}
                                className="text-rose-400 hover:text-rose-300 text-xs"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add ingredient form */}
            <div className="space-y-2">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Ingredient name"
                        value={newIngredientName}
                        onChange={(e) => setNewIngredientName(e.target.value)}
                        list="ingredientNames"
                        className="flex-1 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded text-sm bg-slate-900/80 text-slate-100 placeholder-slate-500"
                    />
                    <datalist id="ingredientNames">
                        {availableIngredients.map(ing => (
                            <option key={ing.id} value={ing.name} />
                        ))}
                    </datalist>
                    <input
                        type="number"
                        placeholder="Qty"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        step="0.1"
                        className="w-16 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded text-sm bg-slate-900/80 text-slate-100"
                    />
                    <select
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded text-sm bg-slate-900/80 text-slate-100"
                    >
                        {commonUnits.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                        ))}
                    </select>
                </div>

                {/* Category selector for new ingredients */}
                {!availableIngredients.find(i => i.name.toLowerCase() === newIngredientName.toLowerCase()) && newIngredientName && (
                    <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as 'PRODUCE' | 'PROTEIN' | 'DAIRY' | 'PANTRY' | 'SPICES' | 'OTHER')}
                        className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded text-sm bg-slate-900/80 text-slate-100"
                    >
                        <option value="PRODUCE">Produce</option>
                        <option value="PROTEIN">Protein</option>
                        <option value="DAIRY">Dairy</option>
                        <option value="PANTRY">Pantry</option>
                        <option value="SPICES">Spices</option>
                        <option value="OTHER">Other</option>
                    </select>
                )}

                <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                    Add Ingredient
                </button>
            </div>
        </div>
    )
}
