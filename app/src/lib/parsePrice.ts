/**
 * parsePrice — Parses a number string that may use Brazilian or standard formatting.
 *
 * Logic:
 *  - If the string contains a comma → BR format (dots are thousands separators, comma is decimal)
 *  - If no comma → standard JS (dot is decimal)
 *
 * Examples:
 *  - "3.900,50" → 3900.50     (BR thousands + decimal)
 *  - "1,7"      → 1.7         (BR decimal)
 *  - "1,23"     → 1.23        (BR decimal)
 *  - "1.000,00" → 1000.00     (BR thousands)
 *  - "1.000"    → 1.0         (API decimal with 3 places)
 *  - "3900.50"  → 3900.50     (standard)
 *  - "50"       → 50          (integer)
 *  - ""         → 0           (empty)
 */
export function parsePrice(value: string | number): number {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    const s = String(value).trim();
    if (!s) return 0;
    let normalized: string;
    if (s.includes(',')) {
        // Formato BR: pontos são milhares, vírgula é decimal
        normalized = s.replace(/\./g, '').replace(',', '.');
    } else {
        // Sem vírgula: o ponto é decimal (padrão JS/API)
        normalized = s;
    }
    const n = parseFloat(normalized);
    return isNaN(n) ? 0 : n;
}
