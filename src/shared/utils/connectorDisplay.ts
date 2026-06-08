/**
 * Etiqueta del conector para mostrar al usuario.
 *
 * El backend envía el código del tipo de conector (p. ej. "CCS2", "TYPE2") en
 * el campo `connectorType`. Si el conector no tiene tipo asignado, caemos al
 * ID numérico del conector como último recurso.
 */
export function formatConnectorCode(
  connectorType: string | null | undefined,
  connectorId?: number | null,
): string {
  const code = connectorType?.trim();
  if (code) return code;

  if (connectorId != null && Number.isFinite(connectorId)) {
    return String(connectorId);
  }

  return '—';
}
