import { MealPlannerTab } from './meal-planner-tab'
import { MealLogTab } from './meal-log-tab'
import { GroceryTab } from './grocery-tab'
import { IngredientEditTab } from './ingredient-edit-tab'
import { PageLayout } from './components/page-layout'

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{
        protein?: string
        category?: string
        search?: string
        tab?: string
        listId?: string
        hideChecked?: string
    }>
}) {
    const params = await searchParams

    // Handle ingredient edit tab separately (not in main navigation)
    if (params.tab === 'ingredients') {
        return (
            <div className="h-screen flex flex-col bg-app-bg">
                <div className="shrink-0 border-b border-primary/30 p-4">
                    <a
                        href={`/?tab=grocery${params.listId ? `&listId=${params.listId}` : ''}`}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary-text transition-colors mb-4"
                    >
                        <span>←</span>
                        <span>Back to Grocery</span>
                    </a>
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="max-w-7xl mx-auto h-full p-1">
                        <IngredientEditTab />
                    </div>
                </div>
            </div>
        )
    }

    const tabs = [
        {
            id: 'meals',
            label: '🍽️ Meals',
            content: <MealPlannerTab searchParams={searchParams} />,
        },
        {
            id: 'logs',
            label: '📅 Log',
            content: <MealLogTab />,
        },
        {
            id: 'grocery',
            label: '🛒 Grocery',
            content: <GroceryTab searchParams={searchParams} />,
        },
    ]

    return <PageLayout title="🍽️ Meal Planner" tabs={tabs} />
}
