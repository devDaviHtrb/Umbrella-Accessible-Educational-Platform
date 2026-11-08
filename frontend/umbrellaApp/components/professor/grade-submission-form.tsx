import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type {
  GradeSubmissionInput,
  ProfessorActivityDetail,
  ProfessorQuestion,
  StudentAnswer,
  StudentSubmission,
} from '@/types/professor';

export type GradeSubmissionFormProps = {
  submission: StudentSubmission;
  activity: ProfessorActivityDetail;
  submitting?: boolean;
  onSubmit: (input: GradeSubmissionInput) => void;
};

type Row = {
  question: ProfessorQuestion;
  position: number;
  answer?: StudentAnswer;
};

function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100).replace('.', ',');
}

function parseScore(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  return Number(trimmed);
}

function initialScore(answer?: StudentAnswer): string {
  if (answer?.score === undefined) return '';
  return formatNumber(answer.score);
}

export function GradeSubmissionForm({ submission, activity, submitting = false, onSubmit }: GradeSubmissionFormProps) {
  const rows = useMemo<Row[]>(
    () =>
      activity.questions.map((question, index) => ({
        question,
        position: index + 1,
        answer: submission.answers.find((item) => item.questionId === question.id),
      })),
    [activity.questions, submission.answers],
  );

  const [scores, setScores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    rows.forEach((row) => {
      initial[row.question.id] = initialScore(row.answer);
    });
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const total = rows.reduce((sum, row) => {
    const parsed = parseScore(scores[row.question.id] ?? '');
    return sum + (parsed ?? 0);
  }, 0);

  function handleSubmit() {
    const nextErrors: Record<string, boolean> = {};
    const questionGrades: GradeSubmissionInput['questionGrades'] = [];

    for (const row of rows) {
      const raw = scores[row.question.id] ?? '';
      const parsed = parseScore(raw);
      if (parsed === null || parsed < 0 || parsed > row.question.points) {
        nextErrors[row.question.id] = true;
        continue;
      }
      if (row.answer) {
        questionGrades.push({ answerId: row.answer.id, score: parsed });
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({ grade: Math.round(total * 100) / 100, questionGrades });
  }

  return (
    <View style={styles.form}>
      <UmbrellaText variant="body" color={Colors.light.textSecondary}>
        {submission.studentName} · {submission.activityTitle}
      </UmbrellaText>
      <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
        Defina a nota de cada questão. O total é a soma das questões. As notas sugeridas abaixo vêm da correção
        automática — ajuste se necessário.
      </UmbrellaText>

      {rows.map((row) => {
        const { question, position, answer } = row;
        const chosen = answer?.chosenAlternativeId
          ? question.alternatives.find((alt) => alt.id === answer.chosenAlternativeId)
          : undefined;

        return (
          <Card key={question.id} tone="muted" style={styles.question}>
            <View style={styles.badgeRow}>
              <StatusBadge label={`Questão ${position}`} tone="neutral" />
              {answer?.isCorrect === true ? (
                <StatusBadge label="Correta" tone="teal" />
              ) : answer?.isCorrect === false ? (
                <StatusBadge label="Incorreta" tone="error" />
              ) : (
                <StatusBadge label="Revisar" tone="primary" />
              )}
              <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                Vale {formatNumber(question.points)} {question.points === 1 ? 'ponto' : 'pontos'}
              </UmbrellaText>
            </View>

            <UmbrellaText variant="bodyMedium">{question.statement}</UmbrellaText>

            <View style={styles.block}>
              <UmbrellaText variant="label" color={Colors.light.primary} style={styles.label}>
                Resposta do aluno
              </UmbrellaText>
              {question.kind === 'multipla_escolha' ? (
                chosen ? (
                  <UmbrellaText variant="body">
                    {chosen.letter}. {chosen.text}
                  </UmbrellaText>
                ) : (
                  <UmbrellaText variant="body" color={Colors.light.textSecondary}>
                    Não respondida.
                  </UmbrellaText>
                )
              ) : answer?.essayAnswer?.trim() ? (
                <UmbrellaText variant="body">{answer.essayAnswer}</UmbrellaText>
              ) : (
                <UmbrellaText variant="body" color={Colors.light.textSecondary}>
                  Não respondida.
                </UmbrellaText>
              )}
            </View>

            {question.kind === 'discursiva' && question.essay?.expectedAnswer ? (
              <View style={styles.block}>
                <UmbrellaText variant="label" color={Colors.light.primary} style={styles.label}>
                  Resposta esperada
                </UmbrellaText>
                <UmbrellaText variant="body" color={Colors.light.textSecondary}>
                  {question.essay.expectedAnswer}
                </UmbrellaText>
              </View>
            ) : null}

            <TextField
              label={`Nota da questão (0 a ${formatNumber(question.points)})`}
              placeholder="Ex: 2"
              keyboardType="decimal-pad"
              value={scores[question.id] ?? ''}
              editable={!!answer}
              error={
                !answer
                  ? 'Sem resposta registrada para pontuar.'
                  : errors[question.id]
                    ? `Informe um valor entre 0 e ${formatNumber(question.points)}.`
                    : undefined
              }
              onChangeText={(value) => {
                setScores((current) => ({ ...current, [question.id]: value }));
                setErrors((current) => {
                  if (!current[question.id]) return current;
                  const next = { ...current };
                  delete next[question.id];
                  return next;
                });
              }}
            />
          </Card>
        );
      })}

      <View style={styles.totalRow}>
        <UmbrellaText variant="headline">Nota total</UmbrellaText>
        <UmbrellaText variant="headline" color={Colors.light.primary}>
          {formatNumber(total)} / {formatNumber(submission.maxScore)}
        </UmbrellaText>
      </View>

      <PrimaryButton
        label={submitting ? 'Salvando...' : 'Salvar Correção'}
        onPress={handleSubmit}
        disabled={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
  question: {
    gap: Spacing.sm,
    borderRadius: Radius.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  block: {
    gap: Spacing.xs,
  },
  label: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
