import React from 'react';
import { FontAwesome6 } from '@expo/vector-icons';

/** Legacy icon pack (no longer used by UI Kitten). Use Icon component or FontAwesome6 directly. */
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

const IconProvider = (name: string | symbol) => ({
  toReactElement: (props: any) => (
    <FontAwesome6
      name={name as any}
      size={props.height || 24}
      color={props.tintColor || '#222'}
      iconStyle={props.iconStyle}
    />
  ),
});
