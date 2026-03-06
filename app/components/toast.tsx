'use client'

type ToastProps = {
    message: string
    onClose: () => void
}

export function Toast({ message, onClose }: ToastProps) {
    return (
        <div className="fixed right-4 top-4 z-70 w-[min(92vw,24rem)]">
            <div
                className="flex items-start justify-between gap-3 rounded-xl border border-emerald-400/40 bg-slate-900/95 px-4 py-3 shadow-xl shadow-emerald-500/10"
                role="status"
                aria-live="polite"
            >
                <div className="text-sm text-slate-100">
                    <span className="mr-2 text-emerald-300">✓</span>
                    {message}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
                    aria-label="Dismiss notification"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
