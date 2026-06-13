import type { PermissionState } from './types';

/** Etiqueta corta del estado del permiso para UI (Settings, badges). */
export function getPermissionStatusLabel(state: PermissionState): string {
  switch (state) {
    case 'granted':
      return 'Activo';
    case 'not-determined':
      return 'No configurado';
    case 'requestable':
      return 'Denegado';
    case 'blocked':
      return 'Bloqueado';
    case 'unavailable':
      return 'No disponible';
    default:
      return 'Desconocido';
  }
}

/** Icono Font Awesome 6 del botón de acción principal según el estado. */
export function getPermissionActionIcon(state: PermissionState): string | null {
  switch (state) {
    case 'granted':
    case 'blocked':
      return 'gear';
    case 'not-determined':
    case 'requestable':
      return 'toggle-on';
    case 'unavailable':
      return null;
    default:
      return null;
  }
}

/** Texto del botón de acción principal según el estado. */
export function getPermissionActionLabel(state: PermissionState): string | null {
  switch (state) {
    case 'granted':
      return 'Administrar';
    case 'not-determined':
    case 'requestable':
      return 'Activar';
    case 'blocked':
      return 'Abrir configuración';
    case 'unavailable':
      return null;
    default:
      return null;
  }
}
