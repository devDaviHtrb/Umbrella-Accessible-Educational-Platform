import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { StatusBadge, type StatusBadgeTone } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { StudentSubmission, SubmissionStatus } from '@/types/professor';

export type SubmissionRowProps = {
  submission: StudentSubmission;
  onGradePress?: () => void;
};

const toneByStatus: Record<SubmissionStatus, StatusBadgeTone> = {
  pendente: 'neutral',
  entregue: 'primary',
  atrasado: 'error',
  corrigido: 'teal',
};

function formatGrade(grade: number): string {
  return String(grade).replace('.', ',');
}

export function SubmissionRow({ submission, onGradePress }: SubmissionRowProps) {
  const canGrade = submission.status === 'entregue' && !!onGradePress;

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.text}>
          <UmbrellaText variant="bodyMedium" numberOfLines={1}>
            {submission.studentName}
          </UmbrellaText>
          <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={2}>
            {submission.activityTitle} · {submission.moduleTitle}
          </UmbrellaText>
        </View>
        <StatusBadge label={submission.statusLabel} tone={toneByStatus[submission.status]} />
      </View>

      <View style={styles.bottomRow}>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.meta}>
          {submission.grade !== undefined
            ? `Nota: ${formatGrade(submission.grade)}`
            : (submission.submittedAtLabel ?? 'Ainda não entregue')}
        </UmbrellaText>

        {canGrade ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Corrigir entrega de ${submission.studentName}`}
            onPress={onGradePress}
            hitSlop={8}
            style={styles.gradeButton}>
            <UmbrellaText variant="label" color={Colors.light.primary}>
              Corrigir
            </UmbrellaText>
          </Pressable>
        ) : null}
      </View>
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
  text: {
    flex: 1,
    gap: Spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  meta: {
    flex: 1,
  },
  gradeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.secondaryFixed,
  },
});