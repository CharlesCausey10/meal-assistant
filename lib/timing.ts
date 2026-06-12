type TimingMeta = Record<string, string | number | boolean | null | undefined>

function isTimingEnabled(): boolean {
    return process.env.NODE_ENV === 'development' || process.env.MEAL_ASSISTANT_TIMING === '1'
}

function formatMeta(meta: TimingMeta | undefined): string {
    if (!meta) {
        return ''
    }

    const entries = Object.entries(meta)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}=${String(value)}`)

    return entries.length > 0 ? ` ${entries.join(' ')}` : ''
}

export function logTiming(label: string, durationMs: number, meta?: TimingMeta) {
    if (!isTimingEnabled()) {
        return
    }

    console.info(`[timing] ${label} ${durationMs.toFixed(1)}ms${formatMeta(meta)}`)
}

export async function measureAsync<T>(
    label: string,
    callback: () => Promise<T>,
    meta?: TimingMeta
): Promise<T> {
    const start = performance.now()

    try {
        return await callback()
    } finally {
        logTiming(label, performance.now() - start, meta)
    }
}
