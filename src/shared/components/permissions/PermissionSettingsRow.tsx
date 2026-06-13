import { Layout, Text } from '@ui-kitten/components';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  getPermissionActionIcon,
  getPermissionActionLabel,
  getPermissionStatusLabel,
} from '../../../modules/permissions/permissionLabels';
import type { PermissionState } from '../../../modules/permissions/types';
import Icon from '../icons/Icon';
import { useAppTheme } from '../../theme/useAppTheme';

export type PermissionSettingsRowProps = {
  title: string;
  status: PermissionState;
  isChecking?: boolean;
  onPress: () => void;
  onRefresh: () => void;
};

export function PermissionSettingsRow({
  title,
  status,
  isChecking = false,
  onPress,
  onRefresh,
}: PermissionSettingsRowProps) {
  const colors = useAppTheme();
  const actionIcon = getPermissionActionIcon(status);
  const actionLabel = getPermissionActionLabel(status);
  const statusLabel = getPermissionStatusLabel(status);
  const isActivateAction =
    status === 'not-determined' || status === 'requestable';
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
      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <Text category="s1" style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          <Text category="c1" style={{ color: statusColor, fontWeight: '700' }}>
            {statusLabel}
          </Text>
        </View>

        <View style={styles.iconActions}>
          {actionIcon ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={actionLabel ?? 'Acción de permiso'}
              onPress={onPress}
              disabled={isChecking}
              style={({ pressed }) => [
                styles.iconBtn,
                isActivateAction
                  ? { backgroundColor: colors.primary }
                  : {
                      backgroundColor: colors.isDark
                        ? colors.backgroundSecondary
                        : colors.backgroundTertiary,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.border,
                    },
                { opacity: isChecking || pressed ? 0.7 : 1 },
              ]}
            >
              <Icon
                name={actionIcon}
                size={18}
                color={isActivateAction ? '#FFFFFF' : colors.primary}
                iconStyle="solid"
              />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar estado"
            onPress={onRefresh}
            disabled={isChecking}
            style={({ pressed }) => [
              styles.iconBtn,
              {
                backgroundColor: colors.isDark
                  ? colors.backgroundSecondary
                  : colors.backgroundTertiary,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                opacity: isChecking || pressed ? 0.7 : 1,
              },
            ]}
          >
            <Icon
              name="arrows-rotate"
              size={18}
              color={colors.primary}
              iconStyle="solid"
            />
          </Pressable>
        </View>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
