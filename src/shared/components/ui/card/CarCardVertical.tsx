import { StyleSheet, View, Pressable } from 'react-native';
import { Text, Button } from '@ui-kitten/components';
import { useAppTheme } from '../../../theme/useAppTheme';
import type { Car } from '../../../../modules/user/types/car';
import CarHorizontalIcon from '../../../../../assets/images/icons/car-horizontal.svg';

export interface CarCardVerticalProps {
  vehicle?: Car | null;
  selected?: boolean;
  onSelect?: () => void;
  onAddNew?: () => void;
}

export const CarCardVertical = ({
  vehicle,
  selected = false,
  onSelect,
  onAddNew,
}: CarCardVerticalProps) => {
  const colors = useAppTheme();
  const isAddNew = vehicle == null;

  const content = (
    <>
      <CarHorizontalIcon width={80} height={52} style={styles.image} />
      {isAddNew ? (
        <Text category="s1" style={[styles.title, { color: colors.primary }]}>
          Nuevo vehículo
        </Text>
      ) : (
        <>
          <Text category="s1" style={[styles.title, { color: colors.primary }]} numberOfLines={1}>
            {vehicle!.brand} {vehicle!.model}
          </Text>

        </>
      )}
      <View style={styles.buttonBlock}>
        {isAddNew ? (
          <Button size="small" status="primary" onPress={onAddNew}>
            Agregar nuevo
          </Button>
        ) : selected ? (
          <Button size="small" status="primary" onPress={onSelect}>
            Seleccionado
          </Button>
        ) : (
          <Button size="small" status="primary" onPress={onSelect}>
            Seleccionar
          </Button>
        )}
      </View>
    </>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      {isAddNew ? (
        <Pressable
          onPress={onAddNew}
          style={styles.inner}
          android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        >
          {content}
        </Pressable>
      ) : onSelect ? (
        <Pressable
          onPress={onSelect}
          style={styles.inner}
          android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.inner}>{content}</View>
      )}
    </View>
  );
};

const CARD_SIZE = 160;

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    minHeight: CARD_SIZE,
    maxHeight: CARD_SIZE,
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
    width: 80,
    height: 52,
    marginBottom: 8,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonBlock: {
    width: '100%',
    marginTop: 8,
  },
});
