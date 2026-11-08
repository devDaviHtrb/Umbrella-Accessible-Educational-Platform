import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { difficultyLabel } from '@/constants/professor-options';
import type { ProfessorCourse } from '@/types/professor';

export type ProfessorCourseCardProps = {
  course: ProfessorCourse;
  onPress: () => void;
  onDeletePress?: () => void;
};

function MetaItem({ icon, label }: { icon: IconSymbolName; label: string }) {
  return (
    <View style={styles.metaItem}>
      <IconSymbol name={icon} size={14} color={Colors.light.textSecondary} />
      <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={1}>
        {label}
      </UmbrellaText>
    </View>
  );
}

export function ProfessorCourseCard({ course, onPress, onDeletePress }: ProfessorCourseCardProps) {
  const pending = course.pendingSubmissionsCount ?? 0;
  const students = course.studentsCount ?? 0;

  return (
    <Card padded={false} style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir curso ${course.title}`}
        onPress={onPress}
        style={styles.pressable}>
        <View style={styles.cover}>
          {course.imageUrl ? (
            <Image
              source={{ uri: course.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
              accessibilityLabel={`Capa do curso ${course.title}`}
            />
          ) : (
            <View style={styles.coverFallback}>
              <IconSymbol name="book.fill" size={28} color={Colors.light.primary} />
            </View>
          )}

          {onDeletePress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Excluir curso ${course.title}`}
              onPress={onDeletePress}
              hitSlop={8}
              style={styles.deleteButton}>
              <IconSymbol name="trash.fill" size={16} color={Colors.light.surface} />
            </Pressable>
          ) : null}

          {pending > 0 ? (
            <View style={styles.pendingBadge}>
              <StatusBadge label={String(pending)} tone="primary" />
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <UmbrellaText variant="label" color={Colors.light.primary} numberOfLines={1}>
            {course.eyebrow || 'Sem categoria'}
          </UmbrellaText>
          <UmbrellaText variant="bodyMedium" numberOfLines={2} style={styles.title}>
            {course.title}
          </UmbrellaText>

          <View style={styles.metaRow}>
            <MetaItem
              icon="person.2.fill"
              label={students === 1 ? '1 aluno' : `${students} alunos`}
            />
            <MetaItem
              icon="list.bullet"
              label={course.modulesCount === 1 ? '1 módulo' : `${course.modulesCount} módulos`}
            />
          </View>
          <MetaItem icon="chart.line.uptrend.xyaxis" label={difficultyLabel(course.difficultyLevel)} />
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  pressable: {
    flex: 1,
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  coverFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondaryFixed,
  },
  deleteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(17, 24, 28, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
