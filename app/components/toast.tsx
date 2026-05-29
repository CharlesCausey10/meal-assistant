'use client'

type ToastProps = {
    message: string
    onClose: () => void
}

export function Toast({ message, onClose }: ToastProps) {
    return (
        <div className="fixed right-4 top-4 z-70 w-[min(92vw,24rem)]">
            <div
                className="flex items-start justify-between gap-3 rounded-xl border border-success/40 bg-app-surface-raised/95 px-4 py-3 shadow-xl shadow-success/10"
                role="status"
                aria-live="polite"
            >
                <div className="text-sm text-app-text">
                    <span className="mr-2 text-success">✓</span>
                    {message}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-md p-1 text-app-subtle hover:bg-app-surface-soft/60 hover:text-app-text/85"
                    aria-label="Dismiss notification"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
