/** Primera letra en mayúscula y el resto en minúsculas (sin uppercase CSS). */
export function formatFormLabel(label: string): string {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}
