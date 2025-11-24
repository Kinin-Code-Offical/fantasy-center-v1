export function formatCurrency(value: number): string {
    if (!value) return "$0.0M";
    // Assuming value is something like 15000 credits.
    // The instruction says: 15000 -> "$15.0M".
    // So we divide by 1000.
    const millions = (value / 1000).toFixed(1);
    return `$${millions}M`;
}
