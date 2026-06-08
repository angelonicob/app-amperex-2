import { StyleSheet, Pressable, View } from 'react-native';
import { Layout, Text, Button } from '@ui-kitten/components';
import { useAppTheme } from '../../../theme/useAppTheme';
import type { Car } from '../../../../modules/user/types/car';
import CarHorizontalIcon from '../../../../../assets/images/icons/car-horizontal.svg';

export interface CarCardVerticalProps {
  vehicle: Car;
  selected?: boolean;
  onSelect?: () => void;
}

export const CarCardVertical = ({
  vehicle,
  selected = false,
  onSelect,
}: CarCardVerticalProps) => {
  const colors = useAppTheme();
  const rippleColor = colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  const cardSurfaceStyle = selected
    ? {
        borderWidth: 2,
        borderColor: colors.borderDark,
        backgroundColor: colors.backgroundTertiary,
      }
    : {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      };

  const content = (
    <>
      <CarHorizontalIcon width={64} height={42} style={styles.image} />
      <View style={styles.infoBlock}>
        <Text
          style={[styles.brand, { color: colors.text }]}
          numberOfLines={1}
        >
          {vehicle.brand}
        </Text>
        <Text
          style={[styles.model, { color: colors.text }]}
          numberOfLines={1}
        >
          {vehicle.model}
        </Text>
        <Text
          style={[styles.plate, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {vehicle.plate.toUpperCase()}
        </Text>
      </View>
      <View style={styles.buttonBlock}>
        <Button size="small" status="primary" onPress={onSelect}>
          {selected ? 'Seleccionado' : 'Seleccionar'}
        </Button>
      </View>
    </>
  );

  return (
    <Layout
      level="2"
      style={[
        styles.card,
        { shadowOpacity: colors.isDark ? 0.32 : 0.08 },
        cardSurfaceStyle,
      ]}
    >
      {onSelect ? (
        <Pressable
          onPress={onSelect}
          style={styles.inner}
          android_ripple={{ color: rippleColor }}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.inner}>{content}</View>
      )}
    </Layout>
  );
};

const CARD_WIDTH = 160;
const CARD_MIN_HEIGHT = 200;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    minHeight: CARD_MIN_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  inner: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  image: {
    width: 64,
    height: 42,
    marginBottom: 6,
  },
  infoBlock: {
    width: '100%',
    alignItems: 'center',
  },
  brand: {
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  model: {
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 2,
  },
  plate: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  buttonBlock: {
    width: '100%',
    marginTop: 10,
  },
});
