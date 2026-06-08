import React from 'react';
import { FontAwesome6 } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useTheme } from '@ui-kitten/components';

/** Pack FA6 registrado en IconRegistry para el `Icon` de UI Kitten. */
export const FontAwesome6IconsPack = {
  name: 'fontawesome6',
  icons: createIconsMap(),
};

function createIconsMap() {
  return new Proxy(
    {},
    {
      get(target: any, name: string) {
        return IconProvider(name);
      },
    },
  );
}

function resolveIconColor(props: Record<string, unknown>): string | undefined {
  const flat = StyleSheet.flatten(props.style as object);
  return (props.tintColor as string | undefined) ?? flat?.tintColor;
}

function resolveIconSize(props: Record<string, unknown>): number {
  const flat = StyleSheet.flatten(props.style as object);
  return (
    (props.height as number | undefined) ??
    flat?.height ??
    flat?.width ??
    24
  );
}

const IconProvider = (name: string | symbol) => ({
  toReactElement: (props: Record<string, unknown>) => (
    <ThemedFontAwesome6 name={name} {...props} />
  ),
});

/** Usa tintColor de Eva; si falta, cae en text-basic-color del tema activo. */
function ThemedFontAwesome6({
  name,
  iconStyle,
  ...props
}: Record<string, unknown> & { name: string | symbol; iconStyle?: string }) {
  const theme = useTheme();
  const color = resolveIconColor(props) ?? theme['text-basic-color'];
  const size = resolveIconSize(props);

  return (
    <FontAwesome6
      name={name as never}
      size={size}
      color={color}
      iconStyle={iconStyle as 'solid' | 'regular' | 'brand' | undefined}
    />
  );
}
