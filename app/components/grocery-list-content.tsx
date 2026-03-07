'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { addManualGroceryItem, toggleGroceryItemChecked } from '../actions-grocery'
import { GroceryItem } from './grocery-item'
import { ResponsiveModal } from './responsive-modal'
import { formatLabel } from '../utils/format'
import type { IngredientCategory } from '@prisma/client'

type GroceryListContentProps = {
    selectedList: {
        id: number
        name: string
        notes: string | null
        sourceMeals: Array<{
            id: number
            meal: {
                name: string
            }
        }>
        items: Array<{
            id: number
            ingredientId: number | null
            nameSnapshot: string
            quantity: number | null
            unit: string | null
            category: IngredientCategory | null
            note: string | null
            isChecked: boolean
            sortOrder: number
            createdAt: Date
        }>
    }
    ingredientCategories: IngredientCategory[]
    groupOrder: string[]
    onCreateListClick: () => void
    groceryLists: Array<{
        id: number
        name: string
    }>
}

type Ingredient = {
    id: number
    name: string
    category: IngredientCategory
}

export function GroceryListContent({
    selectedList,
    ingredientCategories,
    groupOrder,
    onCreateListClick,
    groceryLists,
}: GroceryListContentProps) {
    const [hideChecked, setHideChecked] = useState(false)
    const [hideAmounts, setHideAmounts] = useState(false)
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isViewListsModalOpen, setIsViewListsModalOpen] = useState(false)
    const [expandedIngredientGroups, setExpandedIngredientGroups] = useState<Set<string>>(new Set())
    const [optimisticCheckedById, setOptimisticCheckedById] = useState<Record<number, boolean>>({})
    const hasLoadedRef = useRef(false)
    const isMountedRef = useRef(false)
    
    // Ingredient autocomplete state
    const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
    const [itemNameInput, setItemNameInput] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<IngredientCategory>('OTHER')
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    
    // Desktop form state
    const [desktopItemNameInput, setDesktopItemNameInput] = useState('')
    const [desktopSelectedCategory, setDesktopSelectedCategory] = useState<IngredientCategory>('OTHER')
    const [showDesktopDropdown, setShowDesktopDropdown] = useState(false)
    const desktopDropdownRef = useRef<HTMLDivElement>(null)

    // Load from localStorage after mount
    useEffect(() => {
        isMountedRef.current = true
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true
            try {
                const storedHideChecked = localStorage.getItem('groceryListHideChecked')
                if (storedHideChecked !== null) {
                    const parsed = JSON.parse(storedHideChecked)
                    // Use queueMicrotask to defer state update to avoid cascading render
                    queueMicrotask(() => setHideChecked(parsed))
                }
                const storedHideAmounts = localStorage.getItem('groceryListHideAmounts')
                if (storedHideAmounts !== null) {
                    const parsed = JSON.parse(storedHideAmounts)
                    queueMicrotask(() => setHideAmounts(parsed))
                }
            } catch (error) {
                console.error('Error reading from localStorage:', error)
            }
        }
    }, [])

    // Fetch available ingredients
    useEffect(() => {
        fetch('/api/ingredients')
            .then(res => res.json())
            .then(data => setAvailableIngredients(data))
            .catch(err => console.error('Failed to fetch ingredients:', err))
    }, [])
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
            if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(e.target as Node)) {
                setShowDesktopDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Save preference to localStorage whenever it changes
    useEffect(() => {
        if (isMountedRef.current && hasLoadedRef.current) {
            try {
                localStorage.setItem('groceryListHideChecked', JSON.stringify(hideChecked))
                localStorage.setItem('groceryListHideAmounts', JSON.stringify(hideAmounts))
            } catch (error) {
                console.error('Error writing to localStorage:', error)
            }
        }
    }, [hideChecked, hideAmounts])
    
    // Filter ingredients based on search input
    const filteredIngredients = availableIngredients.filter(ing =>
        ing.name.toLowerCase().includes(itemNameInput.toLowerCase())
    ).slice(0, 5)
    
    const desktopFilteredIngredients = availableIngredients.filter(ing =>
        ing.name.toLowerCase().includes(desktopItemNameInput.toLowerCase())
    ).slice(0, 5)
    
    // Handle selecting an ingredient from dropdown
    const handleSelectIngredient = (ingredient: Ingredient) => {
        setItemNameInput(ingredient.name)
        setSelectedCategory(ingredient.category)
        setShowDropdown(false)
    }
    
    const handleSelectDesktopIngredient = (ingredient: Ingredient) => {
        setDesktopItemNameInput(ingredient.name)
        setDesktopSelectedCategory(ingredient.category)
        setShowDesktopDropdown(false)
    }
    
    // Reset form when modal closes
    const handleCloseModal = () => {
        setIsAddItemModalOpen(false)
        setItemNameInput('')
        setSelectedCategory('OTHER')
        setShowDropdown(false)
    }

    const getEffectiveChecked = (item: { id: number; isChecked: boolean }) => {
        return optimisticCheckedById[item.id] ?? item.isChecked
    }

    const visibleItems = selectedList.items.filter((item) =>
        hideChecked ? !getEffectiveChecked(item) : true
    )

    const groupedItems = visibleItems.reduce<
        Record<string, typeof visibleItems>
    >((groups, item) => {
        const key = item.category || 'UNCATEGORIZED'

        if (!groups[key]) {
            groups[key] = []
        }

        groups[key].push(item)
        return groups
    }, {})

    const groupedEntries = Object.entries(groupedItems).sort((a, b) => {
        const indexA = groupOrder.indexOf(a[0])
        const indexB = groupOrder.indexOf(b[0])

        const safeIndexA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA
        const safeIndexB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB

        return safeIndexA - safeIndexB
    })

    const formatAmount = (item: {
        quantity: number | null
        unit: string | null
    }) => {
        const quantityText = item.quantity !== null ? String(item.quantity) : ''
        const unitText = item.unit?.trim() || ''

        return `${quantityText} ${unitText}`.trim()
    }

    const handleCopyList = async () => {
        const lines: string[] = []

        for (const [group, items] of groupedEntries) {
            // Add category header
            lines.push(formatLabel(group))
            
            // Group items by ingredient
            const ingredientEntryMap = new Map<
                string,
                {
                    key: string
                    items: typeof items
                }
            >()

            for (const item of items) {
                const key =
                    item.ingredientId !== null
                        ? `ingredient:${item.ingredientId}`
                        : `item:${item.id}`

                if (!ingredientEntryMap.has(key)) {
                    ingredientEntryMap.set(key, {
                        key,
                        items: [item],
                    })
                } else {
                    ingredientEntryMap.get(key)!.items.push(item)
                }
            }

            const ingredientEntries = Array.from(ingredientEntryMap.values())

            // Add each ingredient
            for (const entry of ingredientEntries) {
                const primaryItem = entry.items[0]
                const amountList = entry.items
                    .map((item) => formatAmount(item))
                    .filter(Boolean)

                const itemText = hideAmounts || amountList.length === 0
                    ? primaryItem.nameSnapshot
                    : `${amountList.join(', ')} ${primaryItem.nameSnapshot}`

                lines.push(itemText)
            }

            // Add blank line after each category
            lines.push('')
        }

        // Join with newlines and copy to clipboard
        const text = lines.join('\n')
        
        try {
            await navigator.clipboard.writeText(text)
            setIsMenuOpen(false)
        } catch (err) {
            console.error('Failed to copy to clipboard:', err)
        }
    }

    const toggleGroupedItems = async (
        items: Array<{ id: number; isChecked: boolean }>,
        nextChecked: boolean
    ) => {
        const previousStates = new Map<number, boolean>(
            items.map((item) => [item.id, getEffectiveChecked(item)])
        )

        setOptimisticCheckedById((previous) => {
            const next = { ...previous }

            for (const item of items) {
                next[item.id] = nextChecked
            }

            return next
        })

        try {
            await Promise.all(
                items.map(async (item) => {
                    const currentState = previousStates.get(item.id) ?? item.isChecked
                    if (currentState === nextChecked) {
                        return
                    }

                    const formData = new FormData()
                    formData.append('groceryItemId', String(item.id))
                    formData.append('isChecked', String(nextChecked))
                    await toggleGroceryItemChecked(formData)
                })
            )
        } catch (error) {
            setOptimisticCheckedById((previous) => {
                const next = { ...previous }

                for (const [id, checked] of previousStates.entries()) {
                    next[id] = checked
                }

                return next
            })

            console.error('Failed to toggle grouped items:', error)
        }
    }

    return (
        <>
            {/* Floating + button - mobile only */}
            <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="md:hidden fixed bottom-6 right-6 z-40 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl font-light transition-all"
                aria-label="Add grocery item"
            >
                +
            </button>

            {/* View Lists Modal - mobile only */}
            <ResponsiveModal
                title="View Lists"
                isOpen={isViewListsModalOpen}
                onClose={() => setIsViewListsModalOpen(false)}
                position='top'
            >
                <div className="space-y-2">
                    {groceryLists.length === 0 ? (
                        <p className="text-slate-400 text-sm">No grocery lists yet.</p>
                    ) : (
                        groceryLists.map((list) => (
                            <a
                                key={list.id}
                                href={`?listId=${list.id}`}
                                onClick={() => setIsViewListsModalOpen(false)}
                                className="block p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-100 transition-colors border border-slate-600"
                            >
                                {list.name}
                            </a>
                        ))
                    )}
                </div>
            </ResponsiveModal>

            {/* Add Manual Item Modal - mobile only */}
            <ResponsiveModal
                title="Add Manual Item"
                isOpen={isAddItemModalOpen}
                onClose={handleCloseModal}
                position='top'
            >
                <form
                    action={async (formData) => {
                        await addManualGroceryItem(formData)
                        handleCloseModal()
                    }}
                    className="space-y-3"
                >
                    <input type="hidden" name="groceryListId" value={selectedList.id} />
                    <div className="relative" ref={dropdownRef}>
                        <input
                            type="text"
                            name="name"
                            placeholder="Item name"
                            required
                            autoFocus
                            value={itemNameInput}
                            onChange={(e) => {
                                setItemNameInput(e.target.value)
                                setShowDropdown(e.target.value.length > 0)
                            }}
                            onFocus={() => setShowDropdown(itemNameInput.length > 0)}
                            className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                        />
                        {showDropdown && filteredIngredients.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                {filteredIngredients.map((ingredient) => (
                                    <button
                                        key={ingredient.id}
                                        type="button"
                                        onClick={() => handleSelectIngredient(ingredient)}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 text-sm border-b border-slate-700 last:border-b-0"
                                    >
                                        <div className="font-medium">{ingredient.name}</div>
                                        <div className="text-xs text-slate-400">{formatLabel(ingredient.category)}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <select
                        name="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as IngredientCategory)}
                        className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                    >
                        {ingredientCategories.map((category) => (
                            <option key={category} value={category}>
                                {formatLabel(category)}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        className="w-full bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                    >
                        Add Item
                    </button>
                </form>
            </ResponsiveModal>

            <div className="space-y-3">
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold text-slate-100">
                            {selectedList.name}
                        </h2>
                        <div className="flex items-center gap-2">
                            {/* Desktop hide/show toggle */}
                            <button
                                onClick={() => setHideChecked(!hideChecked)}
                                className="hidden md:block text-sm text-purple-300 hover:text-purple-200 transition-colors"
                            >
                                {hideChecked ? 'Show checked items' : 'Hide checked items'}
                            </button>
                            {/* Mobile 3-dot menu */}
                            <div className="md:hidden relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="text-slate-300 hover:text-slate-100 p-2 rounded hover:bg-slate-700/50 transition-colors"
                                    aria-label="Menu"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                </button>
                                {isMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-purple-500/30 rounded-lg shadow-xl z-40 overflow-hidden">
                                            <button
                                                onClick={() => {
                                                    setHideChecked(!hideChecked)
                                                    setIsMenuOpen(false)
                                                }}
                                                className="w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-700/50 transition-colors border-b border-slate-700 flex items-center gap-3"
                                            >
                                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    {hideChecked ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    )}
                                                </svg>
                                                <span>{hideChecked ? 'Show checked items' : 'Hide checked items'}</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setHideAmounts(!hideAmounts)
                                                    setIsMenuOpen(false)
                                                }}
                                                className="w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-700/50 transition-colors border-b border-slate-700 flex items-center gap-3"
                                            >
                                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    {hideAmounts ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" />
                                                    )}
                                                    {!hideAmounts && (
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    )}
                                                </svg>
                                                <span>{hideAmounts ? 'Show amounts' : 'Hide amounts'}</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsViewListsModalOpen(true)
                                                    setIsMenuOpen(false)
                                                }}
                                                className="w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-700/50 transition-colors border-b border-slate-700 flex items-center gap-3"
                                            >
                                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                </svg>
                                                <span>View lists</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onCreateListClick()
                                                    setIsMenuOpen(false)
                                                }}
                                                className="w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-700/50 transition-colors border-b border-slate-700 flex items-center gap-3"
                                            >
                                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                <span>New list</span>
                                            </button>
                                            <button
                                                onClick={handleCopyList}
                                                className="w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-700/50 transition-colors border-b border-slate-700 flex items-center gap-3"
                                            >
                                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <span>Copy list</span>
                                            </button>
                                            <Link
                                                href="/?tab=ingredients"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="w-full text-left px-4 py-3 text-slate-200 hover:bg-slate-700/50 transition-colors flex items-center gap-3"
                                            >
                                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                <span>Edit ingredients</span>
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    {selectedList.notes && (
                        <p className="text-sm text-slate-300">{selectedList.notes}</p>
                    )}
                    {/* {selectedList.sourceMeals.length > 0 && (
                    <div className="text-sm text-slate-300 space-y-1">
                        <p className="text-slate-400">Generated from meals:</p>
                        <div className="flex flex-wrap gap-2">
                            {selectedList.sourceMeals.map((source) => (
                                <span
                                    key={source.id}
                                    className="text-xs bg-slate-700 text-slate-200 px-2 py-1 rounded-full"
                                >
                                    {source.meal.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )} */}
                </div>

                {/* Desktop Add Manual Item form - hidden on mobile */}
                <div className="hidden md:block bg-slate-800/60 border border-purple-500/30 rounded-xl p-3 space-y-2">
                    <h3 className="text-lg font-semibold text-purple-200">Add Manual Item</h3>
                    <form
                        action={async (formData) => {
                            await addManualGroceryItem(formData)
                            setDesktopItemNameInput('')
                            setDesktopSelectedCategory('OTHER')
                        }}
                        className="grid grid-cols-1 md:grid-cols-6 gap-2"
                    >
                        <input type="hidden" name="groceryListId" value={selectedList.id} />
                        <div className="md:col-span-2 relative" ref={desktopDropdownRef}>
                            <input
                                type="text"
                                name="name"
                                placeholder="Item name"
                                required
                                value={desktopItemNameInput}
                                onChange={(e) => {
                                    setDesktopItemNameInput(e.target.value)
                                    setShowDesktopDropdown(e.target.value.length > 0)
                                }}
                                onFocus={() => setShowDesktopDropdown(desktopItemNameInput.length > 0)}
                                className="w-full border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                            />
                            {showDesktopDropdown && desktopFilteredIngredients.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                    {desktopFilteredIngredients.map((ingredient) => (
                                        <button
                                            key={ingredient.id}
                                            type="button"
                                            onClick={() => handleSelectDesktopIngredient(ingredient)}
                                            className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200 text-sm border-b border-slate-700 last:border-b-0"
                                        >
                                            <div className="font-medium">{ingredient.name}</div>
                                            <div className="text-xs text-slate-400">{formatLabel(ingredient.category)}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            name="quantity"
                            placeholder="Qty"
                            className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                        />
                        <input
                            type="text"
                            name="unit"
                            placeholder="Unit"
                            className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                        />
                        <select
                            name="category"
                            value={desktopSelectedCategory}
                            onChange={(e) => setDesktopSelectedCategory(e.target.value as IngredientCategory)}
                            className="border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                        >
                            {ingredientCategories.map((category) => (
                                <option key={category} value={category}>
                                    {formatLabel(category)}
                                </option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded text-sm font-medium transition-colors"
                        >
                            Add Item
                        </button>
                        <input
                            type="text"
                            name="note"
                            placeholder="Optional note"
                            className="md:col-span-6 border border-slate-600 focus:border-purple-400 focus:outline-none p-2 rounded bg-slate-900/80 text-slate-100"
                        />
                    </form>
                </div>

                <div className="space-y-3.5">
                    {groupedEntries.length === 0 ? (
                        <div className="text-center text-slate-400 py-8 bg-slate-800/40 border border-slate-700 rounded-xl">
                            No grocery items yet.
                        </div>
                    ) : (
                        groupedEntries.map(([group, items]) => {
                            const ingredientEntryMap = new Map<
                                string,
                                {
                                    key: string
                                    items: typeof items
                                }
                            >()

                            for (const item of items) {
                                const key =
                                    item.ingredientId !== null
                                        ? `ingredient:${item.ingredientId}`
                                        : `item:${item.id}`

                                if (!ingredientEntryMap.has(key)) {
                                    ingredientEntryMap.set(key, {
                                        key,
                                        items: [item],
                                    })
                                } else {
                                    ingredientEntryMap.get(key)!.items.push(item)
                                }
                            }

                            const ingredientEntries = Array.from(ingredientEntryMap.values())

                            return (
                                <section
                                    key={group}
                                    className="space-y-1.5"
                                >
                                    <h3 className="text-sm uppercase tracking-wide text-purple-300 font-semibold">
                                        {formatLabel(group)}
                                    </h3>
                                    <ul className="space-y-1.5">
                                        {ingredientEntries.map((entry) => {
                                            if (entry.items.length === 1) {
                                                const item = entry.items[0]
                                                const itemWithOptimisticChecked = {
                                                    ...item,
                                                    isChecked: getEffectiveChecked(item),
                                                }

                                                return (
                                                    <GroceryItem
                                                        key={`${item.id}:${itemWithOptimisticChecked.isChecked ? '1' : '0'}`}
                                                        item={itemWithOptimisticChecked}
                                                        ingredientCategories={ingredientCategories}
                                                        hideAmounts={hideAmounts}
                                                    />
                                                )
                                            }

                                            const primaryItem = entry.items[0]
                                            const summaryKey = `${group}:${entry.key}`
                                            const isExpanded = expandedIngredientGroups.has(summaryKey)
                                            const allChecked = entry.items.every((item) => getEffectiveChecked(item))
                                            const someChecked = !allChecked && entry.items.some((item) => getEffectiveChecked(item))

                                            const amountList = entry.items
                                                .map((item) => formatAmount(item))
                                                .filter(Boolean)

                                            const displayName = hideAmounts || amountList.length === 0
                                                ? primaryItem.nameSnapshot
                                                : `${amountList.join(', ')} ${primaryItem.nameSnapshot}`

                                            return (
                                                <li key={summaryKey} className="space-y-1.5">
                                                    <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-2">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const nextChecked = !allChecked
                                                                    void toggleGroupedItems(entry.items, nextChecked)
                                                                }}
                                                                className="flex-1 min-w-0 text-left flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-800/40 transition-colors"
                                                                aria-label={allChecked ? 'Mark as not bought' : 'Mark as bought'}
                                                            >
                                                                <span
                                                                    className={`h-7 w-7 rounded border text-sm shrink-0 inline-flex items-center justify-center ${
                                                                        allChecked
                                                                            ? 'bg-green-600/30 border-green-400 text-green-300'
                                                                            : someChecked
                                                                                ? 'bg-yellow-600/20 border-yellow-400 text-yellow-300'
                                                                                : 'bg-slate-800 border-slate-500 text-slate-300'
                                                                    }`}
                                                                >
                                                                    {allChecked ? '✓' : someChecked ? '−' : ' '}
                                                                </span>
                                                                <span className="flex-1 min-w-0">
                                                                    <span
                                                                        className={`font-medium block ${
                                                                            allChecked ? 'line-through text-slate-500' : 'text-slate-100'
                                                                        }`}
                                                                    >
                                                                        {displayName}
                                                                    </span>
                                                                </span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const next = new Set(expandedIngredientGroups)
                                                                    if (next.has(summaryKey)) {
                                                                        next.delete(summaryKey)
                                                                    } else {
                                                                        next.add(summaryKey)
                                                                    }
                                                                    setExpandedIngredientGroups(next)
                                                                }}
                                                                className="text-purple-400 hover:text-purple-300 hover:bg-slate-700/50 rounded px-2.5 py-0.5 text-sm transition-colors shrink-0"
                                                            >
                                                                {isExpanded ? 'Hide' : 'Edit'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {isExpanded ? (
                                                        <ul className="space-y-1.5 pl-2 border-l border-slate-700/70">
                                                            {entry.items.map((item) => {
                                                                const itemWithOptimisticChecked = {
                                                                    ...item,
                                                                    isChecked: getEffectiveChecked(item),
                                                                }

                                                                return (
                                                                    <GroceryItem
                                                                        key={`${item.id}:${itemWithOptimisticChecked.isChecked ? '1' : '0'}`}
                                                                        item={itemWithOptimisticChecked}
                                                                        ingredientCategories={ingredientCategories}
                                                                        hideAmounts={hideAmounts}
                                                                    />
                                                                )
                                                            })}
                                                        </ul>
                                                    ) : null}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </section>
                            )
                        })
                    )}
                </div>
            </div>
        </>
    )
}
