import { Icon } from '@ui-kitten/components';
import type { ImageProps } from 'react-native';

export type Fa6IconStyle = 'solid' | 'regular' | 'brand';

/**
 * Icono FA6 para `accessoryLeft`, `icon` de tabs, etc.
 * UI Kitten pasa el color del texto en `style.tintColor`; el pack fontawesome6 lo aplica.
 */
export function createKittenFa6Icon(name: string, iconStyle: Fa6IconStyle = 'solid') {
  return (props?: Partial<ImageProps>) => (
    <Icon {...props} name={name} pack="fontawesome6" iconStyle={iconStyle} />
  );
}
