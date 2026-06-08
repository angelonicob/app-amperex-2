// Tema de colores legacy  Usar colors.ts + useAppTheme() en su lugar.
// Primary: #44B778 (verde) en toda la app, independiente del tema.
const PRIMARY = '#44B778'; // rgb(68, 183, 120)

export const customLightTheme: Record<string, string> = {
  // ============================================
  // COLORES PRIMARIOS (Primary Colors) - Verde #44B778
  // ============================================
  'color-primary-100': '#E8F7EF', // Backgrounds muy claros, hover states suaves
  'color-primary-200': '#C5EBD6', // Backgrounds claros, estados hover
  'color-primary-300': '#9DDFBD', // Backgrounds medios, elementos secundarios
  'color-primary-400': '#6BCB9A', // Backgrounds más intensos, estados activos
  'color-primary-500': PRIMARY,   // Color primario principal - botones, badges, iconos activos
  'color-primary-600': '#38A066', // Estados hover/active de botones, bordes
  'color-primary-700': '#2E8A57', // Estados pressed, elementos destacados
  'color-primary-800': '#1F6B3E', // Texto sobre fondos primarios, elementos muy destacados
  'color-primary-900': '#154D2D', // Texto sobre fondos primarios claros, máxima intensidad

  // ============================================
  // COLORES PRIMARIOS TRANSPARENTES (basados en #44B778)
  // ============================================
  'color-primary-transparent-100': 'rgba(68, 183, 120, 0.08)',
  'color-primary-transparent-200': 'rgba(68, 183, 120, 0.16)',
  'color-primary-transparent-300': 'rgba(68, 183, 120, 0.24)',
  'color-primary-transparent-400': 'rgba(68, 183, 120, 0.32)',
  'color-primary-transparent-500': 'rgba(68, 183, 120, 0.40)',
  'color-primary-transparent-600': 'rgba(68, 183, 120, 0.48)',

  // ============================================
  // OTROS COLORES DISPONIBLES
  // ============================================

  // COLORES BÁSICOS (Basic Colors)
  // 'color-basic-100': '#FFFFFF', // Fondo principal claro, cards
  // 'color-basic-200': '#F7F9FC', // Fondos secundarios, separadores
  // 'color-basic-300': '#EDF1F7', // Bordes, dividers
  // 'color-basic-400': '#E4E9F2', // Bordes más visibles
  // 'color-basic-500': '#C5CEE0', // Placeholders, iconos deshabilitados
  // 'color-basic-600': '#8F9BB3', // Texto secundario, hints
  // 'color-basic-700': '#2E3A59', // Texto principal
  // 'color-basic-800': '#222B45', // Texto destacado
  // 'color-basic-900': '#192038', // Texto muy destacado, títulos

  // COLORES DE ÉXITO (Success Colors)
  // 'color-success-100': '#F0FFF4', // Backgrounds de éxito suaves
  // 'color-success-500': '#00E096', // Color de éxito principal - badges, estados exitosos
  // 'color-success-700': '#00B383', // Estados hover/active de éxito

  // COLORES DE ADVERTENCIA (Warning Colors)
  // 'color-warning-100': '#FFFBF0', // Backgrounds de advertencia suaves
  // 'color-warning-500': '#FFAA00', // Color de advertencia principal - alerts, warnings
  // 'color-warning-700': '#FF8C00', // Estados hover/active de advertencia

  // COLORES DE PELIGRO (Danger Colors)
  // 'color-danger-100': '#FFF0F0', // Backgrounds de error suaves
  // 'color-danger-500': '#FF3D71', // Color de peligro principal - errores, botones de eliminar
  // 'color-danger-700': '#E91E63', // Estados hover/active de peligro

  // COLORES DE INFORMACIÓN (Info Colors)
  // 'color-info-100': '#F0F9FF', // Backgrounds de información suaves
  // 'color-info-500': '#0095FF', // Color de información principal - tooltips, info badges
  // 'color-info-700': '#0066CC', // Estados hover/active de información

  // COLORES DE FONDO (Background Colors)
  'background-basic-color-1': '#FFFFFF', // Fondo principal de la app
  // 'background-basic-color-2': '#F7F9FC', // Fondo secundario (cards, modales)
  // 'background-basic-color-3': '#EDF1F7', // Fondo terciario (inputs, separadores)
  // 'background-basic-color-4': '#E4E9F2', // Fondo cuaternario (hover states)

  // COLORES DE TEXTO (Text Colors)
  // 'text-basic-color': '#222B45', // Color de texto principal
  // 'text-hint-color': '#8F9BB3', // Color de texto secundario, placeholders
  // 'text-disabled-color': '#C5CEE0', // Color de texto deshabilitado
  // 'text-control-color': '#FFFFFF', // Color de texto sobre fondos de color (botones, etc.)

  // ============================================
  // BOTTOM NAVIGATION (Personalización)
  // ============================================
  // Variables para personalizar el BottomNavigation
  'bottom-navigation-indicator-background-color': 'transparent', // Ocultar indicador por defecto
};

export const customDarkTheme: Record<string, string> = {
  // ============================================
  // COLORES PRIMARIOS (Primary Colors) - Verde #44B778 - Modo Oscuro
  // ============================================
  'color-primary-100': '#154D2D',
  'color-primary-200': '#1F6B3E',
  'color-primary-300': '#2E8A57',
  'color-primary-400': '#38A066',
  'color-primary-500': PRIMARY,
  'color-primary-600': '#6BCB9A',
  'color-primary-700': '#9DDFBD',
  'color-primary-800': '#C5EBD6',
  'color-primary-900': '#E8F7EF',

  // ============================================
  // COLORES PRIMARIOS TRANSPARENTES - Modo Oscuro (verde #44B778)
  // ============================================
  'color-primary-transparent-100': 'rgba(68, 183, 120, 0.08)',
  'color-primary-transparent-200': 'rgba(68, 183, 120, 0.16)',
  'color-primary-transparent-300': 'rgba(68, 183, 120, 0.24)',
  'color-primary-transparent-400': 'rgba(68, 183, 120, 0.32)',
  'color-primary-transparent-500': 'rgba(68, 183, 120, 0.40)',
  'color-primary-transparent-600': 'rgba(68, 183, 120, 0.48)',

  // ============================================
  // OTROS COLORES DISPONIBLES PARA MODO OSCURO
  // ============================================
  // Descomenta y personaliza según necesites

  // COLORES BÁSICOS (Basic Colors) - Modo Oscuro
  // 'color-basic-100': '#192038', // Fondo principal oscuro
  // 'color-basic-200': '#222B45', // Fondos secundarios oscuros
  // 'color-basic-300': '#2E3A59', // Bordes, dividers en modo oscuro
  // 'color-basic-400': '#8F9BB3', // Bordes más visibles
  // 'color-basic-500': '#C5CEE0', // Placeholders, iconos deshabilitados
  // 'color-basic-600': '#E4E9F2', // Texto secundario, hints
  // 'color-basic-700': '#EDF1F7', // Texto principal
  // 'color-basic-800': '#F7F9FC', // Texto destacado
  // 'color-basic-900': '#FFFFFF', // Texto muy destacado, títulos

  // COLORES DE FONDO (Background Colors) - Modo Oscuro
  'background-basic-color-1': '#111111', // Fondo principal de la app (más oscuro)
  'background-basic-color-2': '#111111', // Fondo secundario (cards, modales)
  'background-basic-color-3': '#222222', // Fondo terciario (inputs, separadores)
  'background-basic-color-4': '#333333', // Fondo cuaternario (hover states)

  // COLORES DE TEXTO (Text Colors) - Modo Oscuro
  'text-basic-color': '#FFFFFF', // Color de texto principal (claro sobre oscuro)
  'text-hint-color': '#888888', // Color de texto secundario, placeholders
  'text-disabled-color': '#555555', // Color de texto deshabilitado
  'text-control-color': '#FFFFFF', // Color de texto sobre fondos de color (botones, etc.)

  // ============================================
  // BOTTOM NAVIGATION (Personalización) - Modo Oscuro
  // ============================================
  // Variables para personalizar el BottomNavigation
  'bottom-navigation-indicator-background-color': 'transparent', // Ocultar indicador por defecto
};
