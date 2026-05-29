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
            <li className="bg-app-surface/80 border border-app-border rounded-lg p-2">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleToggle}
                        className="flex-1 min-w-0 text-left flex items-center gap-2 rounded px-1 py-1 hover:bg-app-surface-soft/60 transition-colors"
                        aria-label={isChecked ? 'Mark as not bought' : 'Mark as bought'}
                    >
                        <span
                            className={`h-7 w-7 rounded border text-sm shrink-0 inline-flex items-center justify-center ${
                                isChecked
                                    ? 'bg-success-soft border-success text-success'
                                    : 'bg-app-surface border-app-border-strong text-app-muted'
                            }`}
                        >
                            {isChecked ? '✓' : ' '}
                        </span>
                        <span className="flex-1 min-w-0">
                            <span
                                className={`font-medium block ${
                                    isChecked ? 'line-through text-app-subtle/80' : 'text-app-text'
                                }`}
                            >
                                {!hideAmounts && item.quantity !== null ? `${String(item.quantity)} ` : ''}
                                {!hideAmounts && item.unit ? `${item.unit} ` : ''}
                                {item.nameSnapshot}
                            </span>
                            {item.note && (
                                <span className="text-xs text-app-subtle mt-0.5 block">{item.note}</span>
                            )}
                        </span>
                    </button>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-primary hover:text-primary-text hover:bg-app-surface-soft/80 rounded px-2.5 py-0.5 text-sm transition-colors shrink-0"
                    >
                        Edit
                    </button>
                </div>
            </li>
        )
    }

    // Edit mode - show all fields
    return (
        <li className="bg-app-surface/80 border border-primary/40 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleToggle}
                    className="flex-1 min-w-0 text-left flex items-center gap-2 rounded px-1 py-1 hover:bg-app-surface-soft/60 transition-colors"
                    aria-label={isChecked ? 'Mark as not bought' : 'Mark as bought'}
                >
                    <span
                        className={`h-7 w-7 rounded border text-sm shrink-0 inline-flex items-center justify-center ${
                            isChecked
                                ? 'bg-success-soft border-success text-success'
                                : 'bg-app-surface border-app-border-strong text-app-muted'
                        }`}
                    >
                        {isChecked ? '✓' : ' '}
                    </span>
                    <span
                        className={`font-medium ${
                            isChecked ? 'line-through text-app-subtle/80' : 'text-app-text'
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
                    className="md:col-span-2 border border-app-border focus:border-primary focus:outline-none p-2 rounded bg-app-surface-raised/90 text-app-text text-base"
                />
                <input
                    type="number"
                    step="0.1"
                    name="quantity"
                    defaultValue={item.quantity !== null ? String(item.quantity) : ''}
                    placeholder="Qty"
                    className="border border-app-border focus:border-primary focus:outline-none p-2 rounded bg-app-surface-raised/90 text-app-text text-base"
                />
                <input
                    type="text"
                    name="unit"
                    defaultValue={item.unit || ''}
                    placeholder="Unit"
                    className="border border-app-border focus:border-primary focus:outline-none p-2 rounded bg-app-surface-raised/90 text-app-text text-base"
                />
                <select
                    name="category"
                    defaultValue={item.category || 'OTHER'}
                    className="border border-app-border focus:border-primary focus:outline-none p-2 rounded bg-app-surface-raised/90 text-app-text text-base"
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
                        className="flex-1 bg-primary hover:bg-primary-hover text-app-text px-3 py-2 rounded text-xs font-medium transition-colors"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-app-surface-soft hover:bg-app-border-strong text-app-text px-3 py-2 rounded text-xs font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
                <input
                    type="text"
                    name="note"
                    defaultValue={item.note || ''}
                    placeholder="Optional note"
                    className="md:col-span-6 border border-app-border focus:border-primary focus:outline-none p-2 rounded bg-app-surface-raised/90 text-app-text text-base"
                />
            </form>
            
            {/* Delete button - separate form outside the update form */}
            <form action={deleteGroceryItem}>
                <input type="hidden" name="groceryItemId" value={item.id} />
                <button
                    type="submit"
                    className="w-full text-danger hover:text-danger-hover hover:bg-danger-soft/70 border border-danger/40 rounded px-3 py-2 text-sm transition-colors"
                    aria-label="Delete grocery item"
                >
                    Delete Item
                </button>
            </form>
        </li>
    )
}
