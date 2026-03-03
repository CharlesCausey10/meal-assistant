'use client'

import { createMeal } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { PreferenceInput } from './preference-input'
import { FormEvent } from 'react'

interface MealFormProps {
    onSuccess?: () => void
}

export function MealForm({ onSuccess }: MealFormProps) {
    const router = useRouter()

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)
        
        await createMeal(formData)
        router.refresh()
        onSuccess?.()
        
        // Reset form
        form.reset()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input name="name" placeholder="Meal name" className="border border-slate-600 focus:border-purple-400 focus:outline-none p-3 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 placeholder-slate-500" required />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select name="protein" className="border border-slate-600 focus:border-purple-400 focus:outline-none p-3 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100">
                    <option value="">Protein (optional)</option>
                    <option value="CHICKEN_BREAST">🐔 Chicken Breast</option>
                    <option value="CHICKEN_THIGHS">🐔 Chicken Thighs</option>
                    <option value="ROTISSERIE_CHICKEN">🐔 Rotisserie Chicken</option>
                    <option value="GROUND_BEEF">🐄 Ground Beef</option>
                    <option value="PORK_BUTT">🐷 Pork Butt</option>
                    <option value="FISH">🐟 Fish</option>
                    <option value="EGGS">🥚 Eggs</option>
                </select>
                <select name="category" className="border border-slate-600 focus:border-purple-400 focus:outline-none p-3 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100" required defaultValue="">
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
            <button type="submit" className="bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-purple-500/20 w-full">
                Add Meal
            </button>
        </form>
    )
}
