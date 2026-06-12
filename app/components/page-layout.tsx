'use client'

import { ReactNode, Suspense, useEffect } from 'react'
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

const LEGACY_TAB_IDS: Record<string, string> = {
    recipes: 'meals',
    logs: 'today',
    leftovers: 'today',
}

function TabIcon({ tabId }: { tabId: string }) {
    const iconClass = 'h-5 w-5'

    switch (tabId) {
        case 'today':
            return (
                <svg aria-hidden="true" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2.75v3.5" />
                    <path d="M16 2.75v3.5" />
                    <path d="M4.75 9.25h14.5" />
                    <path d="M6.75 5.25h10.5a2 2 0 0 1 2 2v10.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2V7.25a2 2 0 0 1 2-2Z" />
                    <path d="m9.25 14.25 1.75 1.75 3.75-4" />
                </svg>
            )
        case 'meals':
            return (
                <svg aria-hidden="true" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.25 3.5v7.25" />
                    <path d="M9.75 3.5v7.25" />
                    <path d="M6.25 7h3.5" />
                    <path d="M8 10.75v9.75" />
                    <path d="M16.75 3.5c1.55 1.7 2.25 3.65 2.25 6.25 0 2.05-.9 3.75-2.25 4.35v6.4" />
                    <path d="M16.75 3.5c-1.55 1.7-2.25 3.65-2.25 6.25 0 2.05.9 3.75 2.25 4.35" />
                </svg>
            )
        case 'grocery':
            return (
                <svg aria-hidden="true" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.75 10.25 9.5 4.75" />
                    <path d="m17.25 10.25-2.75-5.5" />
                    <path d="M4.5 10.25h15l-1.35 8.1a2 2 0 0 1-1.95 1.65H7.8a2 2 0 0 1-1.95-1.65L4.5 10.25Z" />
                    <path d="M9 14v2.5" />
                    <path d="M12 14v2.5" />
                    <path d="M15 14v2.5" />
                </svg>
            )
        case 'discover':
            return (
                <svg aria-hidden="true" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="8.25" />
                    <path d="m14.75 9.25-1.55 3.95-3.95 1.55 1.55-3.95 3.95-1.55Z" />
                </svg>
            )
        case 'account':
            return (
                <svg aria-hidden="true" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8.25" r="3.25" />
                    <path d="M5.5 19.25c1.2-3.1 3.4-4.65 6.5-4.65s5.3 1.55 6.5 4.65" />
                    <circle cx="12" cy="12" r="9.25" />
                </svg>
            )
        default:
            return null
    }
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

    const tabFromUrl = normalizeTabId(searchParams.get('tab'))
    const hasValidTabFromUrl = tabFromUrl !== null && tabs.some(tab => tab.id === tabFromUrl)
    const rawTabFromUrl = searchParams.get('tab')
    const needsLegacyTabRedirect =
        rawTabFromUrl !== null && rawTabFromUrl !== tabFromUrl && tabFromUrl !== null

    const activeTab = hasValidTabFromUrl
        ? tabFromUrl!
        : (tabs[0]?.id || '')

    useEffect(() => {
        if (!activeTab) {
            return
        }

        if (needsLegacyTabRedirect || (rawTabFromUrl !== null && !hasValidTabFromUrl)) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('tab', activeTab)
            router.replace(`${pathname}?${params.toString()}`)
        }
    }, [
        activeTab,
        hasValidTabFromUrl,
        needsLegacyTabRedirect,
        pathname,
        rawTabFromUrl,
        router,
        searchParams,
    ])

    useEffect(() => {
        for (const tab of tabs) {
            if (tab.id === activeTab) {
                continue
            }

            const params = new URLSearchParams(searchParams.toString())
            params.set('tab', tab.id)
            router.prefetch(`${pathname}?${params.toString()}`)
        }
    }, [activeTab, pathname, router, searchParams, tabs])

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
                <div
                    className="grid md:flex md:gap-4"
                    style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-semibold transition-colors md:min-h-16 md:px-4 md:text-sm ${
                                activeTab === tab.id
                                    ? 'text-primary border-t-2 md:border-t-0 md:border-b-2 border-primary'
                                    : 'text-app-subtle hover:text-app-muted'
                            }`}
                        >
                            <TabIcon tabId={tab.id} />
                            <span>{tab.label}</span>
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
            <PageLayoutContent
                title={title}
                tabs={tabs}
            />
        </Suspense>
    )
}
