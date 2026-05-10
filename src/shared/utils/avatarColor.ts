/**
 * Paleta de colores para avatares por nombre (determinista).
 */
const AVATAR_COLORS = [
  '#44b778', // verde primario
  '#3B82F6', // azul
  '#8B5CF6', // violeta
  '#EC4899', // rosa
  '#F59E0B', // ámbar
  '#10B981', // esmeralda
  '#6366F1', // índigo
  '#EF4444', // rojo
  '#06B6D4', // cyan
  '#84CC16', // lima
];

/**
 * Devuelve un color hexadecimal determinista a partir de un nombre.
 * El mismo nombre siempre produce el mismo color.
 */
export function getColorFromName(name: string): string {
  if (!name || typeof name !== 'string') {
    return AVATAR_COLORS[0];
  }
  let hash = 0;
  const str = name.trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
