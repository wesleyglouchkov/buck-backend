export const parseBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === 'string') {
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue === 'true') return true;
        if (lowerValue === 'false') return false;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    return undefined;
};
