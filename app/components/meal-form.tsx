'use client'

import { createMeal } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { PreferenceInput } from './preference-input'
import { IngredientInput } from './ingredient-input'
import { FormEvent, useState } from 'react'

interface IngredientWithQuantity {
    id: number
    name: string
    category: string
    quantity: number
    unit: string
}

interface MealFormProps {
    onSuccess?: () => void
}

export function MealForm({ onSuccess }: MealFormProps) {
    const router = useRouter()
    const [ingredients, setIngredients] = useState<IngredientWithQuantity[]>([])

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)
        
        // Add ingredients as JSON
        formData.append('ingredients', JSON.stringify(ingredients))
        
        await createMeal(formData)
        router.refresh()
        onSuccess?.()
        
        // Reset form
        form.reset()
        setIngredients([])
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input name="name" placeholder="Meal name" className="border border-app-border focus:border-primary focus:outline-none p-2 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text placeholder-app-subtle" required />
            <input name="recipeUrl" placeholder="Recipe URL (optional)" type="url" className="border border-app-border focus:border-primary focus:outline-none p-2 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text placeholder-app-subtle" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select name="protein" className="border border-app-border focus:border-primary focus:outline-none p-2 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text">
                    <option value="">Protein (optional)</option>
                    <option value="CHICKEN_BREAST">🐔 Chicken Breast</option>
                    <option value="CHICKEN_THIGHS">🐔 Chicken Thighs</option>
                    <option value="ROTISSERIE_CHICKEN">🐔 Rotisserie Chicken</option>
                    <option value="GROUND_BEEF">🐄 Ground Beef</option>
                    <option value="PORK_BUTT">🐷 Pork Butt</option>
                    <option value="FISH">🐟 Fish</option>
                    <option value="EGGS">🥚 Eggs</option>
                </select>
                <select name="category" className="border border-app-border focus:border-primary focus:outline-none p-2 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text" required defaultValue="">
                    <option value="" disabled>Select category</option>
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="DINNER">Dinner</option>
                    <option value="SIDE_STARTER">Side/Starter</option>
                    <option value="SNACK">Snack</option>
                    <option value="DESSERT">Dessert</option>
                </select>
                <PreferenceInput padSize="md" />
            </div>
            <IngredientInput onIngredientsChange={setIngredients} />
            <button type="submit" className="bg-linear-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-primary-contrast px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-primary/20 w-full">
                Add Meal
            </button>
        </form>
    )
}
