import { Layout, Text } from '@ui-kitten/components';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  getPermissionActionLabel,
  getPermissionStatusLabel,
} from '../../../modules/permissions/permissionLabels';
import type { PermissionState } from '../../../modules/permissions/types';
import { useAppTheme } from '../../theme/useAppTheme';

export type PermissionSettingsRowProps = {
  title: string;
  description: string;
  status: PermissionState;
  isChecking?: boolean;
  onPress: () => void;
  onRefresh: () => void;
};

export function PermissionSettingsRow({
  title,
  description,
  status,
  isChecking = false,
  onPress,
  onRefresh,
}: PermissionSettingsRowProps) {
  const colors = useAppTheme();
  const actionLabel = getPermissionActionLabel(status);
  const statusLabel = getPermissionStatusLabel(status);
  const statusColor =
    status === 'granted'
      ? colors.primary
      : status === 'blocked'
        ? colors.danger
        : colors.textSecondary;

  return (
    <Layout
      level="2"
      style={[
        styles.row,
        {
          borderColor: colors.border,
          backgroundColor: colors.isDark
            ? colors.backgroundTertiary
            : colors.backgroundSecondary,
        },
      ]}
    >
      <View style={styles.header}>
        <Text category="s2" style={{ color: colors.text }}>
          {title}
        </Text>
        <Text category="c1" style={{ color: statusColor, fontWeight: '700' }}>
          {statusLabel}
        </Text>
      </View>
      <Text category="p2" style={{ color: colors.textSecondary }}>
        {description}
      </Text>
      <View style={styles.actions}>
        {actionLabel ? (
          <Pressable
            onPress={onPress}
            disabled={isChecking}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: colors.primary,
                opacity: isChecking || pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={styles.actionBtnText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onRefresh}
          disabled={isChecking}
          style={({ pressed }) => [
            styles.refreshBtn,
            { opacity: isChecking || pressed ? 0.7 : 1 },
          ]}
        >
          <Text category="c1" style={{ color: colors.primary }}>
            Actualizar estado
          </Text>
        </Pressable>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actions: {
    marginTop: 4,
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  refreshBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
});
