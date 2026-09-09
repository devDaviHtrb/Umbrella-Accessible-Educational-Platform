import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { RecordedLesson } from '@/types/recorded-classes';

export type LessonCardProps = {
  lesson: RecordedLesson;
  onPress?: () => void;
};

export function LessonCard({ lesson, onPress }: LessonCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card padded={false}>
        <View style={[styles.image, { backgroundColor: lesson.imageTone }]}>
          <View style={styles.durationBadge}>
            <UmbrellaText variant="caption" color={Colors.light.surface}>
              {lesson.durationLabel}
            </UmbrellaText>
          </View>
        </View>

        <View style={styles.content}>
          <UmbrellaText variant="label" color={Colors.light.primary} style={styles.category}>
            {lesson.category.toUpperCase()}
          </UmbrellaText>
          <UmbrellaText variant="headline" style={styles.title}>
            {lesson.title}
          </UmbrellaText>
          <UmbrellaText
            variant="body"
            color={Colors.light.textSecondary}
            numberOfLines={2}
            style={styles.description}>
            {lesson.description}
          </UmbrellaText>

          <View style={styles.divider} />

          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <IconSymbol name="calendar" size={14} color={Colors.light.textSecondary} />
              <UmbrellaText variant="label" color={Colors.light.textSecondary}>
                {lesson.dateLabel}
              </UmbrellaText>
            </View>
            <View style={styles.footerItem}>
              <UmbrellaText variant="label" color={Colors.light.primary}>
                Assistir agora
              </UmbrellaText>
              <IconSymbol name="arrow.right" size={14} color={Colors.light.primary} />
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    height: 160,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  durationBadge: {
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(17, 24, 28, 0.65)',
  },
  content: {
    padding: Spacing.lg,
  },
  category: {
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.outline,
    marginBottom: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});