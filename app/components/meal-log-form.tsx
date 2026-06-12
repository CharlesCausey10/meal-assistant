'use client'

import { logMeal } from '@/app/actions-meal-log'
import { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CookingAnimation } from './cooking-animation'
import { PROTEIN_OPTIONS } from '../utils/protein'

interface MealLogFormProps {
    defaultName?: string
    defaultProtein?: string
    mealId?: number
    onSuccess?: () => void
}

export function MealLogForm({
    defaultName = '',
    defaultProtein = '',
    mealId,
    onSuccess,
}: MealLogFormProps) {
    const router = useRouter()
    const today = new Date().toISOString().split('T')[0]

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        await logMeal(formData)
        router.refresh()

        onSuccess?.()
        form.reset()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {mealId !== undefined && (
                <input type="hidden" name="mealId" value={mealId} />
            )}
            <input
                name="name"
                placeholder="Meal name"
                defaultValue={defaultName}
                className="border border-app-border focus:border-primary focus:outline-none p-3 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text placeholder-app-subtle"
                required
            />
            <div className="grid grid-cols-2 gap-3">
                <select
                    name="protein"
                    defaultValue={defaultProtein}
                    className="border border-app-border focus:border-primary focus:outline-none p-3 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text"
                >
                    <option value="">Protein (optional)</option>
                    {PROTEIN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <input
                    name="cookedAt"
                    type="date"
                    defaultValue={today}
                    className="border border-app-border focus:border-primary focus:outline-none p-3 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text"
                    required
                />
            </div>
            <button type="submit" className="bg-linear-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary-hover text-primary-contrast px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-primary/20 w-full">
                <span className="inline-flex items-center justify-center gap-2">
                    <CookingAnimation />
                    <span className="font-semibold">COOK</span>
                </span>
            </button>
        </form>
    )
}
