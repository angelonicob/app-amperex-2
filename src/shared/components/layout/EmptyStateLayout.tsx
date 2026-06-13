import { Button, Layout, Text } from '@ui-kitten/components';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../icons/Icon';
import type { Fa6IconStyle } from '../icons/createKittenFa6Icon';
import { ButtonTransparent } from '../ui/button';
import { useAppTheme } from '../../theme/useAppTheme';
import { useSystemChrome } from '../../hooks/useSystemChrome';

const PLUG_WAIT_ICON_LIGHT = '#F0A020';
const PLUG_WAIT_ICON_DARK = '#C87810';

export const PLUG_CONNECT_DEFAULT_TITLE = 'Conecta el cargador a tu automóvil';

export const PLUG_CONNECT_ICON: EmptyStateIcon = {
  name: 'plug-circle-bolt',
  size: 80,
  iconStyle: 'solid',
};

export type EmptyStateIcon = {
  name: string;
  size?: number;
  color?: string;
  iconStyle?: Fa6IconStyle;
  haloColor?: string;
};

export type EmptyStateAction = {
  label: string;
  onPress: () => void;
  appearance?: 'filled' | 'outline' | 'ghost';
  status?: 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'basic' | 'control';
  disabled?: boolean;
};

export type EmptyStateLayoutProps = {
  title: string;
  subtitle?: string;
  /** Texto secundario (tipografía más pequeña). */
  hint?: string;
  icon?: EmptyStateIcon;
  /** Si se define, muestra un botón con la acción indicada. */
  action?: EmptyStateAction;
  /** Envuelve en SafeAreaView a pantalla completa (p. ej. flujo de sesión). */
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
};

function resolvePlugIconColors(isDark: boolean, icon?: EmptyStateIcon) {
  if (icon?.name !== PLUG_CONNECT_ICON.name) {
    return {
      color: icon?.color,
      halo: icon?.haloColor,
    };
  }
  return {
    color: icon?.color ?? (isDark ? PLUG_WAIT_ICON_DARK : PLUG_WAIT_ICON_LIGHT),
    halo:
      icon?.haloColor ??
      (isDark ? 'rgba(200, 120, 16, 0.2)' : 'rgba(240, 160, 32, 0.18)'),
  };
}

function EmptyStateContent({
  title,
  subtitle,
  hint,
  icon,
  action,
}: Pick<EmptyStateLayoutProps, 'title' | 'subtitle' | 'hint' | 'icon' | 'action'>) {
  const colors = useAppTheme();
  const { color: iconColor, halo: iconHalo } = resolvePlugIconColors(colors.isDark, icon);
  const resolvedIconColor = iconColor ?? colors.primary;
  const resolvedHalo =
    iconHalo ??
    (colors.isDark ? 'rgba(68, 183, 120, 0.15)' : 'rgba(68, 183, 120, 0.12)');

  return (
    <Layout style={styles.centeredBlock}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: resolvedHalo }]}>
          <Icon
            name={icon.name}
            size={icon.size ?? 64}
            color={resolvedIconColor}
            iconStyle={icon.iconStyle ?? 'solid'}
          />
        </View>
      ) : null}
      <Text category="h5" style={styles.blockTitle}>
        {title}
      </Text>
      {subtitle ? (
        <Text category="s1" appearance="hint" style={styles.blockSubtitle}>
          {subtitle}
        </Text>
      ) : null}
      {hint ? (
        <Text category="c2" appearance="hint" style={styles.blockHint}>
          {hint}
        </Text>
      ) : null}
      {action ? (
        action.appearance === 'ghost' ? (
          <ButtonTransparent
            title={action.label}
            onPress={action.onPress}
            disabled={action.disabled}
            color={action.status === 'danger' ? colors.danger : colors.primary}
            style={styles.actionButton}
          />
        ) : (
          <Button
            appearance={action.appearance ?? 'filled'}
            status={action.status ?? 'primary'}
            onPress={action.onPress}
            disabled={action.disabled}
            style={styles.actionButton}
          >
            {action.label}
          </Button>
        )
      ) : null}
    </Layout>
  );
}

/**
 * Bloque centrado con ícono, título, subtítulo y botón opcional.
 * Usar `fullScreen` en flujos modales de sesión; sin él, como estado vacío dentro de listas.
 */
export function EmptyStateLayout({
  title,
  subtitle,
  hint,
  icon,
  action,
  fullScreen = false,
  style,
}: EmptyStateLayoutProps) {
  const screenBackground = useSystemChrome();

  const content = (
    <EmptyStateContent
      title={title}
      subtitle={subtitle}
      hint={hint}
      icon={icon}
      action={action}
    />
  );

  if (fullScreen) {
    return (
      <SafeAreaView
        style={[styles.flex1, { backgroundColor: screenBackground }]}
        edges={['top', 'bottom']}
      >
        <Layout level="1" style={styles.flex1}>
          {content}
        </Layout>
      </SafeAreaView>
    );
  }

  return <View style={[styles.embedded, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  embedded: {
    flex: 1,
    width: '100%',
  },
  centeredBlock: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconWrap: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  blockTitle: { textAlign: 'center', marginBottom: 8 },
  blockSubtitle: { textAlign: 'center', marginBottom: 12, paddingHorizontal: 8 },
  blockHint: {
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
    lineHeight: 18,
    fontSize: 12,
  },
  actionButton: { width: '100%', marginTop: 12 },
});
