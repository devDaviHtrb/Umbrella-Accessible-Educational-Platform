import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { EnrolledStudent } from '@/types/professor';

export type StudentRowProps = {
  student: EnrolledStudent;
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function StudentRow({ student }: StudentRowProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.avatar}>
        <UmbrellaText variant="label" color={Colors.light.primary}>
          {initialsOf(student.name)}
        </UmbrellaText>
      </View>

      <View style={styles.text}>
        <UmbrellaText variant="bodyMedium" numberOfLines={1}>
          {student.name}
        </UmbrellaText>
        {student.email ? (
          <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={1}>
            {student.email}
          </UmbrellaText>
        ) : null}
      </View>

      {student.neurodivergence ? (
        <StatusBadge label={student.neurodivergence} tone="teal" />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondaryFixed,
  },
  text: {
    flex: 1,
    gap: Spacing.xs,
  },
});
