'use client'

import { useState } from 'react'
import {
    deleteGroceryItem,
    toggleGroceryItemChecked,
    updateGroceryItem,
} from '../actions-grocery'
import { formatLabel } from '../utils/format'
import type { IngredientCategory } from '@prisma/client'

type GroceryItemProps = {
    item: {
        id: number
        nameSnapshot: string
        quantity: number | null
        unit: string | null
        category: IngredientCategory | null
        note: string | null
        isChecked: boolean
    }
    ingredientCategories: IngredientCategory[]
    hideAmounts?: boolean
}

export function GroceryItem({ item, ingredientCategories, hideAmounts = false }: GroceryItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isChecked, setIsChecked] = useState(item.isChecked)

    const handleToggle = async () => {
        // Optimistically update UI
        setIsChecked(!isChecked)
        
        // Submit to server in background
        const formData = new FormData()
        formData.append('groceryItemId', String(item.id))
        formData.append('isChecked', (!isChecked).toString())
        
        try {
            await toggleGroceryItemChecked(formData)
        } catch (error) {
            // Revert on error
            setIsChecked(isChecked)
            console.error('Failed to toggle item:', error)
        }
    }

    if (!isEditing) {
        // Simple view for in-store use
        return (
            <li className="bg-slate-900/60 border border-slate-700 rounded-lg p-2">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleToggle}
                        className="flex-1 min-w-0 text-left flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-800/40 transition-colors"
                        aria-label={isChecked ? 'Mark as not bought' : 'Mark as bought'}
                    >
                        <span
                            className={`h-7 w-7 rounded border text-sm shrink-0 inline-flex items-center justify-center ${
                                isChecked
                                    ? 'bg-green-600/30 border-green-400 text-green-300'
                                    : 'bg-slate-800 border-slate-500 text-slate-300'
                            }`}
                        >
                            {isChecked ? '✓' : ' '}
                        </span>
                        <span className="flex-1 min-w-0">
                            <span
                                className={`font-medium block ${
                                    isChecked ? 'line-through text-slate-500' : 'text-slate-100'
                                }`}
                            >
                                {!hideAmounts && item.quantity !== null ? `${String(item.quantity)} ` : ''}
                                {!hideAmounts && item.unit ? `${item.unit} ` : ''}
                                {item.nameSnapshot}
                            </span>
                            {item.note && (
                                <span className="text-xs text-slate-400 mt-0.5 block">{item.note}</span>
                            )}
                        </span>
                    </button>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-purple-400 hover:text-purple-300 hover:bg-slate-700/50 rounded px-2.5 py-0.5 text-sm transition-colors shrink-0"
                    >
                        Edit
                    </button>
                </div>
            </li>
        )
    }

    // Edit mode - show all fields
    return (
        <li className="bg-slate-900/60 border border-purple-500/40 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleToggle}
                    className="flex-1 min-w-0 text-left flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-800/40 transition-colors"
                    aria-label={isChecked ? 'Mark as not bought' : 'Mark as bought'}
                >
                    <span
                        className={`h-7 w-7 rounded border text-sm shrink-0 inline-flex items-center justify-center ${
                            isChecked
                                ? 'bg-green-600/30 border-green-400 text-green-300'
                                : 'bg-slate-800 border-slate-500 text-slate-300'
                        }`}
                    >
                        {isChecked ? '✓' : ' '}
                    </span>
                    <span
                        className={`font-medium ${
                            isChecked ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                    >
                        {!hideAmounts && item.quantity !== null ? `${String(item.quantity)} ` : ''}
                        {!hideAmounts && item.unit ? `${item.unit} ` : ''}
                        {item.nameSnapshot}
                    </span>
                </button>
            </div>

            <form
                action={async (formData) => {
                    await updateGroceryItem(formData)
                    setIsEditing(false)
                }}
                className="grid grid-cols-1 md:grid-cols-6 gap-2"
            >
                <input type="hidden" name="groceryItemId" value={item.id} />
                <input
                    type="text"
                    name="name"
                    defaultValue={item.nameSnapshot}
                    required
                    className="md:col-span-2 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100 text-sm"
                />
                <input
                    type="number"
                    step="0.1"
                    name="quantity"
                    defaultValue={item.quantity !== null ? String(item.quantity) : ''}
                    placeholder="Qty"
                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100 text-sm"
                />
                <input
                    type="text"
                    name="unit"
                    defaultValue={item.unit || ''}
                    placeholder="Unit"
                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100 text-sm"
                />
                <select
                    name="category"
                    defaultValue={item.category || 'OTHER'}
                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100 text-sm"
                >
                    {ingredientCategories.map((category) => (
                        <option key={category} value={category}>
                            {formatLabel(category)}
                        </option>
                    ))}
                </select>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-slate-100 px-3 py-2 rounded text-xs font-medium transition-colors"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded text-xs font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
                <input
                    type="text"
                    name="note"
                    defaultValue={item.note || ''}
                    placeholder="Optional note"
                    className="md:col-span-6 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100 text-sm"
                />
            </form>
            
            {/* Delete button - separate form outside the update form */}
            <form action={deleteGroceryItem}>
                <input type="hidden" name="groceryItemId" value={item.id} />
                <button
                    type="submit"
                    className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-900/20 border border-rose-500/30 rounded px-3 py-2 text-sm transition-colors"
                    aria-label="Delete grocery item"
                >
                    Delete Item
                </button>
            </form>
        </li>
    )
}
