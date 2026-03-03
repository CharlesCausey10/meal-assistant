export function filterPreferenceInput(value: string): string {
    // Filter out non-numeric characters
    const numeric = value.replace(/[^0-9]/g, '');
    
    // If greater than 10, remove the last character
    if (numeric.length > 0 && parseInt(numeric) > 10) {
        return numeric.slice(0, -1);
    }
    
    return numeric;
}
