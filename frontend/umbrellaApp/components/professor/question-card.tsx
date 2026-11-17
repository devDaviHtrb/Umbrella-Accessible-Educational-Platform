import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { professorQuestionKindOptions } from '@/constants/professor-options';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ProfessorQuestion } from '@/types/professor';

export type QuestionCardProps = {
  question: ProfessorQuestion;
  position: number;
  disabled?: boolean;
  onEditPress: () => void;
  onDeletePress: () => void;
};

function pointsLabel(points: number): string {
  return `${points} ${points === 1 ? 'ponto' : 'pontos'}`;
}

function limitsLabel(min?: number, max?: number): string | null {
  if (min && max) return `Entre ${min} e ${max} letras`;
  if (min) return `Mínimo de ${min} letras`;
  if (max) return `Máximo de ${max} letras`;
  return null;
}

export function QuestionCard({ question, position, disabled = false, onEditPress, onDeletePress }: QuestionCardProps) {
  const kindLabel = professorQuestionKindOptions.find((option) => option.id === question.kind)?.label;
  const limits = limitsLabel(question.essay?.minLetters, question.essay?.maxLetters);

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.text}>
          <View style={styles.badgeRow}>
            <StatusBadge label={`Questão ${position}`} tone="neutral" />
            {kindLabel ? (
              <StatusBadge label={kindLabel} tone="primary" />
            ) : (
              <StatusBadge label="Incompleta" tone="error" />
            )}
            <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
              {pointsLabel(question.points)}
            </UmbrellaText>
          </View>
          <UmbrellaText variant="bodyMedium">{question.statement}</UmbrellaText>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar questão ${position}`}
            disabled={disabled}
            onPress={onEditPress}
            hitSlop={8}
            style={[styles.iconButton, disabled && styles.disabled]}>
            <IconSymbol name="square.and.pencil" size={18} color={Colors.light.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Excluir questão ${position}`}
            disabled={disabled}
            onPress={onDeletePress}
            hitSlop={8}
            style={[styles.iconButton, disabled && styles.disabled]}>
            <IconSymbol name="trash.fill" size={18} color={Colors.light.error} />
          </Pressable>
        </View>
      </View>

      {question.kind === 'multipla_escolha' ? (
        <View style={styles.alternatives}>
          {question.alternatives.map((alternative) => (
            <View key={alternative.id} style={styles.alternativeRow}>
              <UmbrellaText
                variant="bodyMedium"
                color={alternative.correct ? Colors.light.success : Colors.light.textSecondary}
                style={styles.letter}>
                {alternative.letter}
              </UmbrellaText>
              <UmbrellaText
                variant="body"
                color={alternative.correct ? Colors.light.success : Colors.light.textSecondary}
                style={styles.alternativeText}>
                {alternative.text}
              </UmbrellaText>
              {alternative.correct ? (
                <IconSymbol name="checkmark" size={16} color={Colors.light.success} />
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {question.kind === 'discursiva' && question.essay ? (
        <View style={styles.essay}>
          <UmbrellaText variant="label" color={Colors.light.primary} style={styles.essayLabel}>
            Resposta esperada
          </UmbrellaText>
          <UmbrellaText variant="body" color={Colors.light.textSecondary} numberOfLines={3}>
            {question.essay.expectedAnswer}
          </UmbrellaText>
          {limits ? (
            <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
              {limits}
            </UmbrellaText>
          ) : null}
        </View>
      ) : null}

      {question.kind === null ? (
        <UmbrellaText variant="caption" color={Colors.light.error}>
          Esta questão não tem alternativas nem resposta esperada. Edite para completá-la ou exclua.
        </UmbrellaText>
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
  text: {
    flex: 1,
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  alternatives: {
    gap: Spacing.sm,
  },
  alternativeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  letter: {
    width: 20,
  },
  alternativeText: {
    flex: 1,
  },
  essay: {
    gap: Spacing.xs,
  },
  essayLabel: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
