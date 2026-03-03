import { prisma } from '@/lib/prisma'
import { createMeal, deleteMeal } from './actions'
import { Protein, Category } from '@prisma/client'
import { Filters } from './filters'

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ protein?: string; category?: string; search?: string }>
}) {
    const params = await searchParams

    const meals = await prisma.meal.findMany({
        where: {
            ...(params.protein && { protein: params.protein as Protein }),
            ...(params.category && { category: params.category as Category }),
            ...(params.search && { name: { contains: params.search } }),
        },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-lavender-200">🍽️ Meal Planner</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - New Meal Form */}
                    <div>
                        <form action={createMeal} className="space-y-3 bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-purple-500/30 sticky top-6">
                            <h2 className="text-lg font-semibold text-purple-200 mb-3">Add New Meal</h2>
                            <input name="name" placeholder="Meal name" className="border border-slate-600 focus:border-purple-400 focus:outline-none p-3 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 placeholder-slate-500" required />
                            <select name="protein" className="border border-slate-600 focus:border-purple-400 focus:outline-none p-3 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100">
                                <option value="">Select protein (optional)</option>
                                <option value="CHICKEN_BREAST">Chicken Breast</option>
                                <option value="CHICKEN_THIGHS">Chicken Thighs</option>
                                <option value="GROUND_BEEF">Ground Beef</option>
                                <option value="PORK_BUTT">Pork Butt</option>
                                <option value="FISH">Fish</option>
                            </select>
                            <select name="category" className="border border-slate-600 focus:border-purple-400 focus:outline-none p-3 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100" required>
                                <option value="" disabled selected>Select category</option>
                                <option value="BREAKFAST">Breakfast</option>
                                <option value="LUNCH">Lunch</option>
                                <option value="DINNER">Dinner</option>
                                <option value="SNACK">Snack</option>
                                <option value="DESSERT">Dessert</option>
                            </select>
                            <button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-purple-500/50 w-full">
                                Add Meal
                            </button>
                        </form>
                    </div>

                    {/* Right Column - Filters and Meal List */}
                    <div className="space-y-6">
                        <Filters />
                        <ul className="space-y-3">
                            {meals.map(meal => (
                                <li key={meal.id} className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 p-4 rounded-xl flex justify-between items-center hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/40 transition-all">
                                    <div>
                                        <div className="font-semibold text-slate-100 text-lg">{meal.name}</div>
                                        <div className="text-sm text-purple-300">
                                            {meal.protein ? meal.protein.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) + ' • ' : ''}{meal.category.charAt(0) + meal.category.slice(1).toLowerCase()}
                                        </div>
                                    </div>
                                    <form action={deleteMeal}>
                                        <input type="hidden" name="id" value={meal.id} />
                                        <button 
                                            type="submit"
                                            className="text-rose-400 hover:text-rose-300 hover:bg-slate-700/50 rounded-lg p-2 transition-colors"
                                            aria-label="Delete meal"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </form>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
