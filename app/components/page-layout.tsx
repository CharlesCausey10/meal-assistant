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
    userEmail?: string;
    householdName?: string;
}

const LEGACY_TAB_IDS: Record<string, string> = {
    recipes: 'meals',
    logs: 'leftovers',
}

function normalizeTabId(tabId: string | null): string | null {
    if (!tabId) {
        return null
    }

    return LEGACY_TAB_IDS[tabId] ?? tabId
}

function PageLayoutContent({ title, tabs, userEmail, householdName }: PageLayoutProps) {
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
            {(userEmail || householdName) ? (
                <header className="shrink-0 border-b border-primary/20 bg-app-surface/90 px-3 py-2 text-xs text-app-muted">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                        <div className="min-w-0">
                            {householdName ? (
                                <span className="font-semibold text-app-text">{householdName}</span>
                            ) : null}
                            {userEmail ? (
                                <span className="ml-2 truncate">{userEmail}</span>
                            ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                            <a
                                href="/households"
                                className="font-semibold text-primary hover:text-primary-text"
                            >
                                Households
                            </a>
                            <a
                                href="/logout"
                                className="font-semibold text-primary hover:text-primary-text"
                            >
                                Sign out
                            </a>
                        </div>
                    </div>
                </header>
            ) : null}
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

export function PageLayout({ title, tabs, userEmail, householdName }: PageLayoutProps) {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-app-bg text-app-subtle">Loading...</div>}>
            <PageLayoutContent
                title={title}
                tabs={tabs}
                userEmail={userEmail}
                householdName={householdName}
            />
        </Suspense>
    )
}
