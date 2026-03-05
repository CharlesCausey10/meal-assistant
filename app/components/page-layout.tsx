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

    const tabFromUrl = searchParams.get('tab')
    const hasValidTabFromUrl = tabs.some(tab => tab.id === tabFromUrl)
    const hasValidSavedTab = savedTab !== null && tabs.some(tab => tab.id === savedTab)

    const activeTab = hasValidTabFromUrl
        ? tabFromUrl!
        : hasValidSavedTab
            ? savedTab!
            : (tabs[0]?.id || '')

    useEffect(() => {
        if (!storageChecked || hasValidTabFromUrl || !activeTab) {
            return
        }

        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', activeTab)

        router.replace(`${pathname}?${params.toString()}`)
    }, [activeTab, hasValidTabFromUrl, pathname, router, searchParams, storageChecked])

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

    return (
        <div className="h-screen flex flex-col bg-slate-900">
            <h1 className="sr-only">{title}</h1>
            <div className="shrink-0 border-b border-purple-500/30">
                <div className="max-w-7xl mx-auto">
                    {/* Tab Navigation */}
                    <div className="flex gap-4 pb-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`px-4 py-2 font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'text-purple-400 border-b-2 border-purple-500'
                                        : 'text-slate-400 hover:text-slate-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                <div className="max-w-7xl mx-auto h-full p-1">
                    {activeTabContent}
                </div>
            </div>
        </div>
    )
}

export function PageLayout({ title, tabs }: PageLayoutProps) {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-900 text-slate-400">Loading...</div>}>
            <PageLayoutContent title={title} tabs={tabs} />
        </Suspense>
    )
}
