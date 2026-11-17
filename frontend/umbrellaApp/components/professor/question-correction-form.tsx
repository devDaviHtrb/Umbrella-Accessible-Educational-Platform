import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { AnswerCorrectionInput, SubmissionCorrection } from '@/types/professor';

export type QuestionCorrectionFormProps = {
  correction: SubmissionCorrection;
  submitting?: boolean;
  onSubmit: (answers: AnswerCorrectionInput[]) => void;
};

type AnswerState = {
  isCorrect: boolean;
  scoreText: string;
};

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',');
}

export function QuestionCorrectionForm({ correction, submitting = false, onSubmit }: QuestionCorrectionFormProps) {
  const [states, setStates] = useState<Record<string, AnswerState>>(() => {
    const initial: Record<string, AnswerState> = {};
    for (const answer of correction.answers) {
      initial[answer.answerId] = {
        isCorrect: answer.isCorrect,
        scoreText: formatScore(answer.score),
      };
    }
    return initial;
  });
  const [showError, setShowError] = useState(false);

  const total = useMemo(() => {
    return correction.answers.reduce((sum, answer) => {
      const parsed = Number((states[answer.answerId]?.scoreText ?? '').trim().replace(',', '.'));
      return sum + (Number.isNaN(parsed) ? 0 : parsed);
    }, 0);
  }, [states, correction.answers]);

  function updateAnswer(answerId: string, patch: Partial<AnswerState>) {
    setStates((prev) => ({ ...prev, [answerId]: { ...prev[answerId], ...patch } }));
    setShowError(false);
  }

  function handleToggleCorrect(answerId: string, points: number, checked: boolean) {
    updateAnswer(answerId, {
      isCorrect: checked,
      scoreText: checked ? formatScore(points) : '0',
    });
  }

  function handleSubmit() {
    const result: AnswerCorrectionInput[] = [];
    for (const answer of correction.answers) {
      const state = states[answer.answerId];
      const score = Number((state?.scoreText ?? '').trim().replace(',', '.'));
      if (state?.scoreText.trim() === '' || Number.isNaN(score) || score < 0 || score > answer.points) {
        setShowError(true);
        return;
      }
      result.push({ answerId: answer.answerId, isCorrect: state.isCorrect, score });
    }
    onSubmit(result);
  }

  return (
    <View style={styles.form}>
      <UmbrellaText variant="body" color={Colors.light.textSecondary}>
        {correction.studentName} · {correction.activityTitle}
      </UmbrellaText>

      {correction.answers.length === 0 ? (
        <Card tone="muted">
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Esta entrega não tem respostas registradas para corrigir.
          </UmbrellaText>
        </Card>
      ) : (
        correction.answers.map((answer) => {
          const state = states[answer.answerId];
          return (
            <Card key={answer.answerId} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <UmbrellaText variant="label" color={Colors.light.primary}>
                  Questão {answer.questionNumber || '—'}
                </UmbrellaText>
                <StatusBadge
                  label={answer.kind === 'discursiva' ? 'DISCURSIVA' : 'MÚLTIPLA ESCOLHA'}
                  tone={answer.kind === 'discursiva' ? 'neutral' : 'teal'}
                />
              </View>

              <UmbrellaText variant="bodyMedium">{answer.statement}</UmbrellaText>

              <View style={styles.answerBlock}>
                <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                  Resposta do aluno
                </UmbrellaText>
                <UmbrellaText variant="body">
                  {answer.kind === 'discursiva'
                    ? answer.essayAnswer?.trim() || 'Sem resposta.'
                    : answer.chosenAlternativeText || 'Nenhuma alternativa marcada.'}
                </UmbrellaText>
              </View>

              {answer.kind === 'multipla_escolha' && answer.correctAlternativeText ? (
                <View style={styles.answerBlock}>
                  <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                    Alternativa correta
                  </UmbrellaText>
                  <UmbrellaText variant="body" color={Colors.light.success}>
                    {answer.correctAlternativeText}
                  </UmbrellaText>
                </View>
              ) : null}

              {answer.kind === 'discursiva' && answer.expectedAnswer ? (
                <View style={styles.answerBlock}>
                  <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                    Resposta esperada
                  </UmbrellaText>
                  <UmbrellaText variant="body" color={Colors.light.textSecondary}>
                    {answer.expectedAnswer}
                  </UmbrellaText>
                </View>
              ) : null}

              <Checkbox
                checked={state?.isCorrect ?? false}
                onChange={(checked) => handleToggleCorrect(answer.answerId, answer.points, checked)}
                label="Marcar como correta"
              />

              <TextField
                label={`Nota da questão (0 a ${formatScore(answer.points)})`}
                placeholder="Ex: 1"
                keyboardType="decimal-pad"
                value={state?.scoreText ?? ''}
                onChangeText={(value) => updateAnswer(answer.answerId, { scoreText: value })}
              />
            </Card>
          );
        })
      )}

      <View style={styles.totalRow}>
        <UmbrellaText variant="bodyMedium">Nota total</UmbrellaText>
        <UmbrellaText variant="title" color={Colors.light.primary}>
          {formatScore(Number(total.toFixed(2)))} / {formatScore(correction.maxScore)}
        </UmbrellaText>
      </View>

      {showError ? (
        <UmbrellaText variant="caption" color={Colors.light.error}>
          Revise as notas: cada questão deve ter uma nota entre 0 e os pontos da questão.
        </UmbrellaText>
      ) : null}

      {correction.answers.length > 0 ? (
        <PrimaryButton
          label={submitting ? 'Salvando...' : 'Salvar Correção'}
          onPress={handleSubmit}
          disabled={submitting}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
  questionCard: {
    gap: Spacing.md,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  answerBlock: {
    gap: Spacing.xs,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
