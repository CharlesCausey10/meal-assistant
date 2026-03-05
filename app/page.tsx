import { MealPlannerTab } from './meal-planner-tab'
import { MealLogTab } from './meal-log-tab'
import { PageLayout } from './components/page-layout'

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ protein?: string; category?: string; search?: string; tab?: string }>
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
    ]

    return <PageLayout title="🍽️ Meal Planner" tabs={tabs} />
}
