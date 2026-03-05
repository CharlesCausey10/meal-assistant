'use client'

import { ReactNode } from 'react'

interface ResponsiveModalProps {
    title: string
    isOpen: boolean
    onClose: () => void
    children: ReactNode
    position?: 'top' | 'bottom' // Mobile position: top or bottom of screen
}

export function ResponsiveModal({ title, isOpen, onClose, children, position = 'bottom' }: ResponsiveModalProps) {
    if (!isOpen) return null

    const positionClasses = position === 'top' 
        ? 'top-0 rounded-b-2xl' 
        : 'bottom-0 rounded-t-2xl'

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                aria-label="Close modal"
            />
            <div className={`absolute inset-x-0 ${position === 'top' ? 'top-0' : 'bottom-0'} md:inset-0 md:flex md:items-center md:justify-center md:p-4 pointer-events-none`}>
                <div className={`pointer-events-auto bg-slate-900 border border-purple-500/30 ${positionClasses} md:rounded-xl shadow-2xl w-full max-h-[85vh] overflow-y-auto md:max-w-md`}>
                    <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
                        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg p-2 transition-colors"
                            aria-label="Close modal"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
