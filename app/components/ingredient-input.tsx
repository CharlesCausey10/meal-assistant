'use client'

import { useState, useEffect, useRef } from 'react'
import type { Ingredient } from '@prisma/client'
import { ResponsiveModal } from './responsive-modal'

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
    const [searchInput, setSearchInput] = useState('')
    const [selectedIngredientId, setSelectedIngredientId] = useState<number | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [newQuantity, setNewQuantity] = useState('')
    const [newUnit, setNewUnit] = useState('whole')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newIngredientName, setNewIngredientName] = useState('')
    const [newIngredientCategory, setNewIngredientCategory] = useState<string>('PRODUCE')
    const [isCreatingIngredient, setIsCreatingIngredient] = useState(false)

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

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredIngredients = availableIngredients.filter(ing =>
        ing.name.toLowerCase().includes(searchInput.toLowerCase()) &&
        !ingredients.some(selected => selected.id === ing.id)
    )

    const handleSelectIngredient = (ingredient: Ingredient) => {
        setSelectedIngredientId(ingredient.id)
        setSearchInput(ingredient.name)
        setIsOpen(false)
    }

    const handleAddIngredient = () => {
        if (!selectedIngredientId || !newQuantity) return

        const ingredient = availableIngredients.find(i => i.id === selectedIngredientId)
        if (!ingredient) return

        // Add to meal's ingredients
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

        // Reset form
        setSearchInput('')
        setSelectedIngredientId(null)
        setNewQuantity('')
        setNewUnit('whole')
    }

    const handleRemoveIngredient = (id: number) => {
        setIngredients(ingredients.filter(ing => ing.id !== id))
    }

    const handleCreateIngredient = async () => {
        if (!newIngredientName.trim() || !newIngredientCategory) return

        setIsCreatingIngredient(true)
        try {
            const response = await fetch('/api/ingredients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newIngredientName, category: newIngredientCategory })
            })

            if (!response.ok) throw new Error('Failed to create ingredient')

            const newIngredient = await response.json()
            setAvailableIngredients([...availableIngredients, newIngredient].sort((a, b) => a.name.localeCompare(b.name)))
            
            // Auto-select the new ingredient
            handleSelectIngredient(newIngredient)
            setIsModalOpen(false)
            setNewIngredientName('')
            setNewIngredientCategory('PRODUCE')
        } catch (err) {
            console.error('Failed to create ingredient:', err)
        } finally {
            setIsCreatingIngredient(false)
        }
    }

    const commonUnits = ['whole', 'piece', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'stick', 'pack']

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
                    <div className="relative flex-1" ref={dropdownRef}>
                        <input
                            type="text"
                            placeholder="Search ingredients..."
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value)
                                setSelectedIngredientId(null)
                                setIsOpen(true)
                            }}
                            onFocus={() => setIsOpen(true)}
                            className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded text-sm bg-slate-900/80 text-slate-100"
                        />
                        
                        {isOpen && filteredIngredients.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                                {filteredIngredients.map(ing => (
                                    <button
                                        key={ing.id}
                                        type="button"
                                        onClick={() => handleSelectIngredient(ing)}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-100 text-sm transition-colors"
                                    >
                                        {ing.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded text-sm font-medium transition-colors"
                        title="Add new ingredient"
                    >
                        +
                    </button>
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

                <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded text-sm font-medium transition-colors"
                >
                    Add Ingredient
                </button>
            </div>

            <ResponsiveModal title="Add New Ingredient" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="space-y-3">
                    <div>
                        <label htmlFor="ingredient-name" className="block text-sm font-medium text-slate-200 mb-1">
                            Ingredient Name
                        </label>
                        <input
                            id="ingredient-name"
                            type="text"
                            placeholder="e.g., Broccoli"
                            value={newIngredientName}
                            onChange={(e) => setNewIngredientName(e.target.value)}
                            className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded text-sm bg-slate-900/80 text-slate-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="ingredient-category" className="block text-sm font-medium text-slate-200 mb-1">
                            Category
                        </label>
                        <select
                            id="ingredient-category"
                            value={newIngredientCategory}
                            onChange={(e) => setNewIngredientCategory(e.target.value)}
                            className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded text-sm bg-slate-900/80 text-slate-100"
                        >
                            <option value="OTHER">Other</option>
                            <option value="DAIRY">Dairy</option>
                            <option value="DRINKS">Drinks</option>
                            <option value="GRAINS_BREAD">Grains & Bread</option>
                            <option value="SWEETS">Sweets</option>
                            <option value="NUTS_SEEDS">Nuts & Seeds</option>
                            <option value="SPICES_HERBS">Spices & Herbs</option>
                            <option value="BAKING">Baking</option>
                            <option value="CANNED_GOODS">Canned Goods</option>
                            <option value="OILS_VINEGARS">Oils & Vinegars</option>
                            <option value="CONDIMENTS">Condiments</option>
                            <option value="FROZEN">Frozen</option>
                            <option value="SNACKS_CHIPS">Snacks & Chips</option>
                            <option value="MEAT">Meat</option>
                            <option value="SEAFOOD">Seafood</option>
                            <option value="PRODUCE">Produce</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={handleCreateIngredient}
                        disabled={!newIngredientName.trim() || isCreatingIngredient}
                        className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-100 px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                        {isCreatingIngredient ? 'Creating...' : 'Create Ingredient'}
                    </button>
                </div>
            </ResponsiveModal>
        </div>
    )
}