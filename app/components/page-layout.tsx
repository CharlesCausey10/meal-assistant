'use client'

import { ReactNode, Suspense } from 'react'
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

function PageLayoutContent({ title, tabs }: PageLayoutProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const tabFromUrl = searchParams.get('tab')
    const activeTab = tabs.some(tab => tab.id === tabFromUrl) ? tabFromUrl! : (tabs[0]?.id || '')

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
            <div className="flex-shrink-0 border-b border-purple-500/30">
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
