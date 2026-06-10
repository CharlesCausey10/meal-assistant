'use client'

import { ReactNode, Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface Tab {
    id: string;
    label: string;
    content: ReactNode;
}

interface PageLayoutProps {
    title: string;
    tabs: Tab[];
}

const LAST_TAB_STORAGE_KEY = 'meal-planner:last-tab'

const LEGACY_TAB_IDS: Record<string, string> = {
    meals: 'recipes',
    logs: 'leftovers',
}

function normalizeTabId(tabId: string | null): string | null {
    if (!tabId) {
        return null
    }

    return LEGACY_TAB_IDS[tabId] ?? tabId
}

function PageLayoutContent({ title, tabs }: PageLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [savedTab, setSavedTab] = useState<string | null>(null)
    const [storageChecked, setStorageChecked] = useState(false)

    useEffect(() => {
        try {
            setSavedTab(window.localStorage.getItem(LAST_TAB_STORAGE_KEY))
        } catch {
            setSavedTab(null)
        } finally {
            setStorageChecked(true)
        }
    }, [])

    const tabFromUrl = normalizeTabId(searchParams.get('tab'))
    const normalizedSavedTab = normalizeTabId(savedTab)
    const hasValidTabFromUrl = tabFromUrl !== null && tabs.some(tab => tab.id === tabFromUrl)
    const hasValidSavedTab =
        normalizedSavedTab !== null && tabs.some(tab => tab.id === normalizedSavedTab)
    const rawTabFromUrl = searchParams.get('tab')
    const needsLegacyTabRedirect =
        rawTabFromUrl !== null && rawTabFromUrl !== tabFromUrl && tabFromUrl !== null

    const activeTab = hasValidTabFromUrl
        ? tabFromUrl!
        : hasValidSavedTab
            ? normalizedSavedTab!
            : (tabs[0]?.id || '')

    useEffect(() => {
        if (!storageChecked || !activeTab) {
            return
        }

        if (needsLegacyTabRedirect || (!hasValidTabFromUrl && activeTab)) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('tab', activeTab)
            router.replace(`${pathname}?${params.toString()}`)
        }
    }, [
        activeTab,
        hasValidTabFromUrl,
        needsLegacyTabRedirect,
        pathname,
        router,
        searchParams,
        storageChecked,
    ])

    useEffect(() => {
        if (!storageChecked || !activeTab) {
            return
        }

        try {
            window.localStorage.setItem(LAST_TAB_STORAGE_KEY, activeTab)
        } catch {
            // Ignore write errors (e.g. blocked storage).
        }
    }, [activeTab, storageChecked])

    const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

    const handleTabChange = (tabId: string) => {
        if (tabId === activeTab) return

        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', tabId)
        router.push(`${pathname}?${params.toString()}`)
    }

    const tabNavigation = (
        <nav
            className="shrink-0 order-last md:order-first border-t md:border-t-0 md:border-b border-primary/30 bg-app-bg"
            aria-label="Primary"
        >
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-3 md:flex md:gap-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`min-h-14 px-2 py-2 text-sm md:min-h-0 md:px-4 md:text-base font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'text-primary border-t-2 md:border-t-0 md:border-b-2 border-primary'
                                    : 'text-app-subtle hover:text-app-muted'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    )

    return (
        <div className="h-dvh flex flex-col bg-app-bg">
            <h1 className="sr-only">{title}</h1>
            {tabNavigation}

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                <div className="max-w-7xl mx-auto h-full p-1 flex flex-col">
                    {activeTabContent}
                </div>
            </div>
        </div>
    )
}

export function PageLayout({ title, tabs }: PageLayoutProps) {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-app-bg text-app-subtle">Loading...</div>}>
            <PageLayoutContent title={title} tabs={tabs} />
        </Suspense>
    )
}
