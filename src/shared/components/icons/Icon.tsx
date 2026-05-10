import { FontAwesome6 } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

export type iconStyle = 'solid' | 'regular' | 'brand';

interface IconProps {
  name: string;
  style?: StyleProp<TextStyle>;
  iconStyle?: iconStyle;
  size?: number;
  color?: string;
}

const Icon = ({ name, style, iconStyle, size, color }: IconProps) => {
  const colors = useAppTheme();
  const iconColor = color ?? colors.text;

  return (
    <FontAwesome6
      name={name as any}
      style={style}
      size={size}
      color={iconColor}
      iconStyle={iconStyle}
    />
  );
};

export default Icon;
