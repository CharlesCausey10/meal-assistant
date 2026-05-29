'use client'

import { filterPreferenceInput } from '../utils/preference'

interface PreferenceInputProps {
    name?: string;
    defaultValue?: number | string;
    className?: string;
    padSize?: 'sm' | 'md';
}

export function PreferenceInput({ 
    name = 'preference',
    defaultValue = '',
    className = 'border border-app-border focus:border-primary focus:outline-none p-3 w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text placeholder-app-subtle',
    padSize = 'md'
}: PreferenceInputProps) {
    const baseClass = 'border border-app-border focus:border-primary focus:outline-none w-full rounded-lg transition-colors bg-app-surface-raised/90 text-app-text placeholder-app-subtle';
    const padding = padSize === 'sm' ? 'p-2 text-sm' : 'p-2';
    const defaultClass = `${baseClass} ${padding}`;

    return (
        <input
            name={name}
            type="text"
            pattern="^([1-9]|10)?$"
            maxLength={2}
            defaultValue={defaultValue}
            placeholder="Rating (1-10)"
            onChange={(e) => {
                e.target.value = filterPreferenceInput(e.target.value);
            }}
            className={className || defaultClass}
        />
    );
}
