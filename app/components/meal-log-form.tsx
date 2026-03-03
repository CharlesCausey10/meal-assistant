'use client'

import { logMeal } from '@/app/actions-meal-log'
import { FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface MealLogFormProps {
    defaultName?: string
    defaultProtein?: string
    onSuccess?: () => void
}

export function MealLogForm({ defaultName = '', defaultProtein = '', onSuccess }: MealLogFormProps) {
    const router = useRouter()
    const today = new Date().toISOString().split('T')[0]

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)
        await logMeal(formData)
        router.refresh()
        if (onSuccess) {
            onSuccess()
        }
        // Reset form
        form.reset()
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input 
                name="name" 
                placeholder="Meal name" 
                defaultValue={defaultName}
                className="border border-slate-600 focus:border-purple-400 focus:outline-none p-3 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 placeholder-slate-500" 
                required 
            />
            <div className="grid grid-cols-2 gap-3">
                <select 
                    name="protein" 
                    defaultValue={defaultProtein}
                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-3 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100"
                >
                    <option value="">Protein (optional)</option>
                    <option value="CHICKEN_BREAST">🐔 Chicken Breast</option>
                    <option value="CHICKEN_THIGHS">🐔 Chicken Thighs</option>
                    <option value="ROTISSERIE_CHICKEN">🐔 Rotisserie Chicken</option>
                    <option value="GROUND_BEEF">🐄 Ground Beef</option>
                    <option value="PORK_BUTT">🐷 Pork Butt</option>
                    <option value="FISH">🐟 Fish</option>
                    <option value="EGGS">🥚 Eggs</option>
                </select>
                <input 
                    name="cookedAt" 
                    type="date" 
                    defaultValue={today}
                    className="border border-slate-600 focus:border-purple-400 focus:outline-none p-3 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100" 
                    required 
                />
            </div>
            <button type="submit" className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-purple-500/50 w-full">
                Log Meal
            </button>
        </form>
    )
}
