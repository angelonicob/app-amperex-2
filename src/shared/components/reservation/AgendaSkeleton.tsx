import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

const SLOT_HEIGHT = 48;
const SKELETON_ROWS = 12;

export function AgendaSkeleton() {
  const colors = useAppTheme();
  const bone = colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={styles.wrap}>
      <View style={[styles.headerBone, { backgroundColor: bone }]} />
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <View
          key={i}
          style={[styles.row, { height: SLOT_HEIGHT, backgroundColor: bone }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 8 },
  headerBone: {
    height: 20,
    borderRadius: 6,
    marginBottom: 16,
    width: '60%',
    alignSelf: 'center',
  },
  row: {
    borderRadius: 8,
    marginBottom: 4,
    opacity: 0.9,
  },
});
