import { getAuthenticatedContext } from '@/lib/auth'
import { DashboardTab } from './dashboard-tab'
import { DiscoverTab } from './discover-tab'
import { GroceryTab } from './grocery-tab'
import { IngredientEditTab } from './ingredient-edit-tab'
import { MealLogTab } from './meal-log-tab'
import { MealPlannerTab } from './meal-planner-tab'
import { PageLayout } from './components/page-layout'

const LEGACY_TAB_IDS: Record<string, string> = {
    recipes: 'meals',
    logs: 'leftovers',
}

const MAIN_TAB_IDS = ['today', 'meals', 'leftovers', 'grocery', 'discover'] as const
type MainTabId = (typeof MAIN_TAB_IDS)[number]

function getActiveTabId(tab: string | undefined): MainTabId {
    const normalizedTab = tab ? LEGACY_TAB_IDS[tab] ?? tab : 'today'
    return MAIN_TAB_IDS.includes(normalizedTab as MainTabId)
        ? normalizedTab as MainTabId
        : 'today'
}

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
    const authContext = await getAuthenticatedContext()
    const params = await searchParams
    const activeTabId = getActiveTabId(params.tab)

    // Handle ingredient edit tab separately (not in main navigation)
    if (params.tab === 'ingredients') {
        return (
            <div className="h-screen flex flex-col bg-app-bg">
                <div className="shrink-0 border-b border-primary/30 p-4">
                    <a
                        href={`/?tab=grocery${params.listId ? `&listId=${params.listId}` : ''}`}
                        className="inline-flex items-center gap-2 text-primary hover:text-primary-text transition-colors mb-4"
                    >
                        <span aria-hidden="true">←</span>
                        <span>Back to Grocery</span>
                    </a>
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="max-w-7xl mx-auto h-full p-1">
                        <IngredientEditTab householdId={authContext.household.id} />
                    </div>
                </div>
            </div>
        )
    }

    const tabs = [
        {
            id: 'today',
            label: '✨ Today',
            content: activeTabId === 'today' ? (
                <DashboardTab
                    householdId={authContext.household.id}
                    userId={authContext.user.id}
                />
            ) : null,
        },
        {
            id: 'meals',
            label: '🍽️ Meals',
            content: activeTabId === 'meals' ? (
                <MealPlannerTab
                    searchParams={searchParams}
                    householdId={authContext.household.id}
                    userId={authContext.user.id}
                />
            ) : null,
        },
        {
            id: 'leftovers',
            label: '🧊 Leftovers',
            content: activeTabId === 'leftovers'
                ? <MealLogTab householdId={authContext.household.id} />
                : null,
        },
        {
            id: 'grocery',
            label: '🛒 Grocery',
            content: activeTabId === 'grocery' ? (
                <GroceryTab
                    searchParams={searchParams}
                    householdId={authContext.household.id}
                    userId={authContext.user.id}
                />
            ) : null,
        },
        {
            id: 'discover',
            label: 'Discover',
            content: activeTabId === 'discover' ? (
                <DiscoverTab
                    householdId={authContext.household.id}
                    userId={authContext.user.id}
                />
            ) : null,
        },
    ]

    return (
        <PageLayout
            title="🍽️ Meal Planner"
            tabs={tabs}
            userEmail={authContext.user.email}
            householdName={authContext.household.name}
        />
    )
}
