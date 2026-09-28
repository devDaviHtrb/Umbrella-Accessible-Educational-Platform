import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ResourceListItem } from '@/components/courses/resource-list-item';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { CourseLesson, CourseModule } from '@/types/courses';

export type ModuleAccordionProps = {
  module: CourseModule;
  defaultExpanded?: boolean;
  onLessonPress?: (lesson: CourseLesson) => void;
};

export function ModuleAccordion({ module, defaultExpanded = false, onLessonPress }: ModuleAccordionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card padded={false} style={expanded ? styles.cardExpanded : undefined}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={styles.header}>
        <View style={[styles.numberBadge, expanded && styles.numberBadgeActive]}>
          <UmbrellaText variant="label" color={expanded ? Colors.light.surface : Colors.light.text}>
            {module.number}
          </UmbrellaText>
        </View>

        <View style={styles.headerText}>
          <UmbrellaText variant="bodyMedium" color={expanded ? Colors.light.primary : Colors.light.text}>
            {module.title}
          </UmbrellaText>
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            {module.subtitle}
          </UmbrellaText>
        </View>

        <IconSymbol
          name={expanded ? 'chevron.up' : 'chevron.down'}
          size={18}
          color={Colors.light.textSecondary}
        />
      </Pressable>

      {expanded && module.lessons.length > 0 ? (
        <View style={styles.lessons}>
          {module.lessons.map((lesson) => (
            <ResourceListItem
              key={lesson.id}
              lesson={lesson}
              onPress={() => onLessonPress?.(lesson)}
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardExpanded: {
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeActive: {
    backgroundColor: Colors.light.primary,
  },
  headerText: {
    flex: 1,
  },
  lessons: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
});