import { prisma } from '@/lib/prisma'
import { createMeal } from './actions'
import { Protein, Category } from '@prisma/client'
import { Filters } from './filters'
import { MealList } from './meal-list'
import { PreferenceInput } from './components/preference-input'

export async function MealPlannerTab({
    searchParams,
}: {
    searchParams: Promise<{ protein?: string; category?: string; search?: string }>
}) {
    const params = await searchParams

    // Parse comma-separated values for multi-select filters
    const proteins = params.protein?.split(',').filter(Boolean) as Protein[] | undefined
    const categories = params.category?.split(',').filter(Boolean) as Category[] | undefined

    const meals = await prisma.meal.findMany({
        where: {
            ...(proteins && proteins.length > 0 && { protein: { in: proteins } }),
            ...(categories && categories.length > 0 && { category: { in: categories } }),
            ...(params.search && { name: { contains: params.search } }),
        },
        orderBy: [
            { preference: 'desc' },
            { createdAt: 'desc' }
        ],
    })

    return (
        <div className="flex gap-6 h-full">
            {/* Left Column - New Meal Form and Filters */}
            <div className="w-80 flex-shrink-0 space-y-6 overflow-y-auto p-4 flex-1">
                <form action={createMeal} className="space-y-3 bg-slate-800 p-6 rounded-xl shadow-lg border border-purple-500/30">
                    <h2 className="text-lg font-semibold text-purple-200 mb-3">Add New Meal</h2>
                    <input name="name" placeholder="Meal name" className="border border-slate-600 focus:border-purple-400 focus:outline-none p-3 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 placeholder-slate-500" required />
                    <div className="grid grid-cols-3 gap-3">
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
                    <button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-purple-500/50 w-full">
                        Add Meal
                    </button>
                </form>
                <Filters />
            </div>

            {/* Right Column - Meal List */}
            <div className="flex-1 overflow-y-auto p-4">
                <MealList meals={meals} />
            </div>
        </div>
    )
}
