import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  BORDER_COLOR,
  BORDER_WIDTH,
  DISABLED_OPACITY,
  LABEL_COLOR,
  PLACEHOLDER_COLOR,
} from '../../../constants/formConstants';
import { formatFormLabel } from './formatFormLabel';

export interface FormSelectIndexPath {
  row: number;
}

/** @deprecated Use FormSelectIndexPath. Kept for backward compatibility. */
export type IndexPath = FormSelectIndexPath;

export interface FormSelectProps {
  label: string;
  placeholder: string;
  selectedIndex: IndexPath | undefined;
  onSelect: (index: IndexPath) => void;
  value: string;
  options: string[];
  disabled?: boolean;
  containerRef?: React.RefObject<View | null>;
  onSelectCallback?: () => void;
  style?: ViewProps['style'];
  selectStyle?: ViewProps['style'];
}

export const FormSelect = ({
  label,
  placeholder,
  selectedIndex,
  onSelect,
  value,
  options,
  disabled = false,
  containerRef,
  style,
  selectStyle,
  onSelectCallback,
}: FormSelectProps) => {
  const [open, setOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const insets = useSafeAreaInsets();
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, search]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setSearch('');
    setModalVisible(true);
    setOpen(true);
  }, [disabled]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!modalVisible) return;
    // Ensure we start hidden (off-screen) before animating in
    sheetTranslateY.setValue(1000);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [modalVisible, sheetTranslateY, backdropOpacity]);

  useEffect(() => {
    if (!modalVisible) return;
    if (open) return;

    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 1000,
        duration: 230,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setModalVisible(false);
      setSearch('');
    });
  }, [open, modalVisible, sheetTranslateY, backdropOpacity]);

  const handleSelect = useCallback(
    (row: number) => {
      setTimeout(() => {
        onSelect({ row });
        onSelectCallback?.();
      }, 0);
      handleClose();
    },
    [onSelect, onSelectCallback, handleClose],
  );

  const displayValue = value || placeholder;
  const isPlaceholder = !value;

  return (
    <View ref={containerRef as React.RefObject<View>} style={[styles.wrapper, style]}>
      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        style={[
          styles.trigger,
          selectStyle,
          disabled && styles.triggerDisabled,
        ]}
      >
        <View style={styles.triggerContent}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, disabled && styles.labelDisabled]} numberOfLines={1}>
              {formatFormLabel(label)}
            </Text>
          </View>
          <View style={styles.valueRow}>
            <Text
              style={[styles.value, isPlaceholder && styles.placeholder]}
              numberOfLines={1}
            >
              {displayValue}
            </Text>
            <Ionicons
              name={open ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={disabled ? LABEL_COLOR : PLACEHOLDER_COLOR}
              style={styles.chevron}
            />
          </View>
        </View>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Animated.View style={[styles.modalBackdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalBackdropTouchable}
            onPress={handleClose}
          >
          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <Animated.View style={{ transform: [{ translateY: sheetTranslateY }] }}>
              <Pressable
                style={[
                  styles.modalContent,
                  {
                    paddingTop: Math.max(12, insets.top + 12),
                    paddingBottom: Math.max(12, insets.bottom + 12),
                  },
                ]}
                onPress={(e) => e.stopPropagation()}
              >
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetLabel}>{formatFormLabel(label)}</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={22} color={LABEL_COLOR} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar..."
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ScrollView
                style={styles.listScroll}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                {filteredOptions.length === 0 ? (
                  <View style={styles.empty}>
                    <Text style={styles.emptyText}>Sin resultados</Text>
                  </View>
                ) : (
                  filteredOptions.map((item) => {
                    const optionIndex = options.indexOf(item);
                    const isSelected =
                      selectedIndex !== undefined && selectedIndex.row === optionIndex;
                    return (
                      <TouchableOpacity
                        key={`${optionIndex}-${item}`}
                        style={[styles.option, isSelected && styles.optionSelected]}
                        onPress={() => handleSelect(optionIndex)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.optionText} numberOfLines={1}>
                          {item}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={18} color={BORDER_COLOR} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
              </Pressable>
            </Animated.View>
          </KeyboardAvoidingView>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  trigger: {
    borderWidth: BORDER_WIDTH,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 52,
    justifyContent: 'center',
  },
  triggerDisabled: {
    opacity: DISABLED_OPACITY,
  },
  triggerContent: {},
  labelRow: {
    marginBottom: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: LABEL_COLOR,
  },
  labelDisabled: {
    color: LABEL_COLOR,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholder: {
    color: PLACEHOLDER_COLOR,
  },
  chevron: {
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    maxHeight: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sheetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: LABEL_COLOR,
  },
  closeButton: {
    padding: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER_COLOR,
  },
  optionSelected: {
    backgroundColor: 'rgba(209, 213, 219, 0.25)',
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: PLACEHOLDER_COLOR,
  },
});
