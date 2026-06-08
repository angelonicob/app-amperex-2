import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Layout, Text, useTheme } from '@ui-kitten/components';
import { useAppTheme } from '../../theme/useAppTheme';

export interface SectionSelectProps {
  sections: Array<{ id: string; label: string }>;
  activeId: string;
  onSelect: (id: string) => void;
  children?: React.ReactNode;
  renderContent?: (sectionId: string) => React.ReactNode;
}

export const SectionSelect = ({
  sections,
  activeId,
  onSelect,
  children,
  renderContent,
}: SectionSelectProps) => {
  const colors = useAppTheme();
  const theme = useTheme();
  const [tabsWidth, setTabsWidth] = useState(0);

  const activeIndex = useMemo(() => {
    const idx = sections.findIndex((s) => s.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [sections, activeId]);

  const tabWidth = useMemo(() => {
    if (tabsWidth <= 0) return 0;
    return tabsWidth / Math.max(1, sections.length);
  }, [tabsWidth, sections.length]);

  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tabWidth <= 0) return;
    Animated.spring(translateX, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      stiffness: 220,
      damping: 26,
      mass: 0.9,
    }).start();
  }, [activeIndex, tabWidth, translateX]);

  return (
    <Layout
      level="2"
      style={[
        styles.card,
        { shadowOpacity: colors.isDark ? 0.32 : 0.08 },
      ]}
    >
      <View
        style={[
          styles.tabsWrap,
          {
            backgroundColor: theme['background-basic-color-3'],
            borderColor: colors.border,
          },
        ]}
        onLayout={(e) => setTabsWidth(e.nativeEvent.layout.width)}
      >
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activePill,
              {
                width: tabWidth,
                backgroundColor: colors.primary,
                transform: [{ translateX }],
              },
            ]}
          />
        )}
        {sections.map(({ id, label }) => {
          const isActive = id === activeId;
          return (
            <Pressable
              key={id}
              onPress={() => onSelect(id)}
              style={({ pressed }) => [
                styles.tab,
                pressed && !isActive ? { opacity: 0.85 } : null,
              ]}
              android_ripple={{ color: 'rgba(0,0,0,0.08)', borderless: false }}
            >
              <Text
                category="s2"
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.white : colors.text },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {children != null ? (
        <View style={styles.content}>{children}</View>
      ) : renderContent != null ? (
        <View style={styles.content}>{renderContent(activeId)}</View>
      ) : null}
    </Layout>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tabsWrap: {
    flexDirection: 'row',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  activePill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  tabLabel: {
    fontWeight: '600',
  },
  content: {
    minHeight: 40,
  },
});
