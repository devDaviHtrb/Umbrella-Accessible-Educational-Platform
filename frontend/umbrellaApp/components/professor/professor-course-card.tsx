import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ProfessorCourse } from '@/types/professor';

export type ProfessorCourseCardProps = {
  course: ProfessorCourse;
  onPress: () => void;
  onEditPress?: () => void;
};

function MetaItem({ icon, label }: { icon: IconSymbolName; label: string }) {
  return (
    <View style={styles.metaItem}>
      <IconSymbol name={icon} size={16} color={Colors.light.textSecondary} />
      <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
        {label}
      </UmbrellaText>
    </View>
  );
}

export function ProfessorCourseCard({ course, onPress, onEditPress }: ProfessorCourseCardProps) {
  const pending = course.pendingSubmissionsCount ?? 0;

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir curso ${course.title}`}
          onPress={onPress}
          style={styles.main}>
          <View style={styles.badgeRow}>
            <StatusBadge
              label={course.statusLabel}
              tone={course.status === 'publicado' ? 'teal' : 'neutral'}
            />
            <UmbrellaText variant="label" color={Colors.light.textSecondary}>
              {course.eyebrow}
            </UmbrellaText>
          </View>
          <UmbrellaText variant="headline">{course.title}</UmbrellaText>
          <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={2}>
            {course.description}
          </UmbrellaText>
        </Pressable>

        {onEditPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar curso ${course.title}`}
            onPress={onEditPress}
            hitSlop={8}
            style={styles.editButton}>
            <IconSymbol name="square.and.pencil" size={18} color={Colors.light.primary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <MetaItem
          icon="list.bullet"
          label={course.modulesCount === 1 ? '1 módulo' : `${course.modulesCount} módulos`}
        />
        {course.activitiesCount !== undefined ? (
          <MetaItem
            icon="doc.fill"
            label={course.activitiesCount === 1 ? '1 atividade' : `${course.activitiesCount} atividades`}
          />
        ) : null}
      </View>

      {pending > 0 ? (
        <View style={styles.footerRow}>
          <StatusBadge
            label={pending === 1 ? '1 entrega para corrigir' : `${pending} entregas para corrigir`}
            tone="primary"
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  main: {
    flex: 1,
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
});