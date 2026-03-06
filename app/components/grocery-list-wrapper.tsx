'use client'

import { useState } from 'react'
import { GroceryListSidebar } from './grocery-list-sidebar'
import { GroceryListContent } from './grocery-list-content'
import type { IngredientCategory } from '@prisma/client'

type GroceryListWrapperProps = {
    mealOptions: Array<{ id: number; name: string; categoryLabel: string }>
    groceryListsForSidebar: Array<{
        id: number
        name: string
    }>
    serializedSelectedList: {
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
            nameSnapshot: string
            quantity: number | null
            unit: string | null
            category: IngredientCategory | null
            note: string | null
            isChecked: boolean
            sortOrder: number
            createdAt: Date
        }>
    } | null
    ingredientCategories: IngredientCategory[]
    groupOrder: string[]
}

export function GroceryListWrapper({
    mealOptions,
    groceryListsForSidebar,
    serializedSelectedList,
    ingredientCategories,
    groupOrder,
}: GroceryListWrapperProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    return (
        <>
            <GroceryListSidebar
                mealOptions={mealOptions}
                groceryLists={groceryListsForSidebar}
                selectedListId={serializedSelectedList?.id ?? null}
                isCreateModalOpen={isCreateModalOpen}
                onCreateModalOpenChange={setIsCreateModalOpen}
            />

            <div className="flex-1 overflow-y-auto p-4">
                {!serializedSelectedList ? (
                    <div className="h-full grid place-items-center text-slate-400">
                        Select or create a grocery list.
                    </div>
                ) : (
                    <GroceryListContent
                        selectedList={serializedSelectedList}
                        ingredientCategories={ingredientCategories}
                        groupOrder={groupOrder}
                        onCreateListClick={() => setIsCreateModalOpen(true)}
                        groceryLists={groceryListsForSidebar}
                    />
                )}
            </div>
        </>
    )
}
