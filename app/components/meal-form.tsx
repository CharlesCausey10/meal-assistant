'use client'

import { createMeal } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { PreferenceInput } from './preference-input'
import { IngredientInput } from './ingredient-input'
import { CategoryCheckboxGroup } from './category-checkbox-group'
import { PROTEIN_OPTIONS } from '../utils/protein'

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
    const [resetKey, setResetKey] = useState(0)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        formData.append('ingredients', JSON.stringify(ingredients))

        const result = await createMeal(formData)
        if (!result.ok) {
            setErrorMessage(result.error ?? 'Could not save this meal.')
            return
        }

        setErrorMessage(null)
        router.refresh()
        onSuccess?.()

        form.reset()
        setIngredients([])
        setResetKey((value) => value + 1)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input
                name="name"
                placeholder="Meal name"
                className="border border-app-border focus:border-primary focus:outline-none p-2 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text placeholder-app-subtle"
                required
            />
            {errorMessage ? (
                <div className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
                    {errorMessage}
                </div>
            ) : null}
            <input
                name="recipeUrl"
                placeholder="Recipe URL (optional)"
                type="url"
                className="border border-app-border focus:border-primary focus:outline-none p-2 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text placeholder-app-subtle"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                    <span className="text-sm font-semibold text-app-text">Protein</span>
                    <select
                        name="protein"
                        className="border border-app-border focus:border-primary focus:outline-none p-2 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text"
                    >
                        <option value="">Optional</option>
                        {PROTEIN_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <PreferenceInput key={resetKey} padSize="md" />
            </div>
            <CategoryCheckboxGroup key={resetKey} />
            <IngredientInput onIngredientsChange={setIngredients} />
            <button type="submit" className="bg-linear-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-primary-contrast px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-primary/20 w-full">
                Add Meal
            </button>
        </form>
    )
}
