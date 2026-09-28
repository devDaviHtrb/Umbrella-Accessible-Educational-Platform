import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { CourseLesson } from '@/types/courses';

export type ResourceListItemProps = {
  lesson: CourseLesson;
  onPress?: () => void;
};

export function ResourceListItem({ lesson, onPress }: ResourceListItemProps) {
  const icon = lesson.type === 'video' ? 'play.circle.fill' : 'doc.fill';

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={styles.left}>
        <IconSymbol name={icon} size={18} color={Colors.light.primary} />
        <UmbrellaText variant="bodyMedium">{lesson.title}</UmbrellaText>
      </View>
      <UmbrellaText
        variant="label"
        color={lesson.type === 'doc' ? Colors.light.primary : Colors.light.textSecondary}>
        {lesson.meta}
      </UmbrellaText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});