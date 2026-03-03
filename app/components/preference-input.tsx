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
    className = 'border border-slate-600 focus:border-purple-400 focus:outline-none p-3 w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 placeholder-slate-500',
    padSize = 'md'
}: PreferenceInputProps) {
    const baseClass = 'border border-slate-600 focus:border-purple-400 focus:outline-none w-full rounded-lg transition-colors bg-slate-900/80 text-slate-100 placeholder-slate-500';
    const padding = padSize === 'sm' ? 'p-2 text-sm' : 'p-3';
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
