/**
 * Formatos de patente de vehículos en Chile (solo validación de forma, no RR.SS.):
 * - Antiguo: 2 letras + 4 números (ej. AB1234)
 * - Mercosur: 4 letras + 2 números (ej. ABCD12)
 *
 * Se ignoran espacios y guiones al validar y al normalizar.
 */
export function normalizeChilePlate(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

export function isValidChilePlateFormat(raw: string): boolean {
  const p = normalizeChilePlate(raw);
  if (p.length < 6 || p.length > 6) return false;
  if (!/^[A-Z0-9]+$/.test(p)) return false;
  // Antiguo: XX + 1234
  if (/^[A-Z]{2}\d{4}$/.test(p)) return true;
  // Mercosur: XXXX + 12
  if (/^[A-Z]{4}\d{2}$/.test(p)) return true;
  return false;
}

export const CHILE_PLATE_HINT =
  'Usa el formato chileno: 2 letras y 4 números (ej. AB1234) o 4 letras y 2 números (ej. ABCD12).';
