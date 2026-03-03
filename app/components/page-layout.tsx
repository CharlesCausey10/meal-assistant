'use client'

import { ReactNode, useState } from 'react'

interface Tab {
    id: string;
    label: string;
    content: ReactNode;
}

interface PageLayoutProps {
    title: string;
    tabs: Tab[];
}

export function PageLayout({ title, tabs }: PageLayoutProps) {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || '')

    const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

    return (
        <div className="h-screen flex flex-col bg-slate-900">
            <div className="flex-shrink-0 border-b border-purple-500/30">
                <div className="max-w-7xl mx-auto">
                    {/* Tab Navigation */}
                    <div className="flex gap-4 pb-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
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
