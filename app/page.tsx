import { MealPlannerTab } from './meal-planner-tab'
import { MealLogTab } from './meal-log-tab'
import { GroceryTab } from './grocery-tab'
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
