import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { QuestionCard } from '@/components/professor/question-card';
import { QuestionForm } from '@/components/professor/question-form';
import { Card } from '@/components/ui/card';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import {
  QUESTION_INCOMPLETE_MESSAGE,
  QuestionSaveError,
  useProfessorCourses,
} from '@/hooks/api/professor/useProfessorCourses';
import type { ProfessorActivityDetail, ProfessorQuestion, ProfessorQuestionInput } from '@/types/professor';
import { confirmDestructive } from '@/utils/confirm';

export type QuestionBuilderProps = {
  activity: ProfessorActivityDetail;
  onChanged: () => Promise<unknown>;
};

type SheetState = { mode: 'create' } | { mode: 'edit'; question: ProfessorQuestion } | null;

export function QuestionBuilder({ activity, onChanged }: QuestionBuilderProps) {
  const { createQuestion, updateQuestion, deleteQuestion } = useProfessorCourses();
  const { height } = useWindowDimensions();

  const [sheet, setSheet] = useState<SheetState>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const busy = useRef(false);

  const { questions } = activity;
  const totalPoints = Math.round(questions.reduce((sum, item) => sum + item.points, 0) * 100) / 100;
  const locked = saving || deletingId !== null;

  function openSheet(next: SheetState) {
    setNotice(undefined);
    setSheetError(undefined);
    setSheet(next);
  }

  async function handleSubmit(input: ProfessorQuestionInput) {
    if (busy.current || !sheet) return;
    busy.current = true;
    setSaving(true);
    setSheetError(undefined);

    try {
      if (sheet.mode === 'create') {
        const nextNumber = Math.max(0, ...questions.map((item) => item.number)) + 1;
        await createQuestion(activity, input, nextNumber);
      } else {
        await updateQuestion(activity, sheet.question, input);
      }
    } catch (error) {
      if (sheet.mode === 'edit') {
        await onChanged();
        setSheet(null);
        setNotice(
          'Não foi possível salvar todas as alterações. A lista mostra o que está salvo: revise a questão e tente de novo.',
        );
      } else if (error instanceof QuestionSaveError && error.message === QUESTION_INCOMPLETE_MESSAGE) {
        await onChanged();
        setSheet(null);
        setNotice(error.message);
      } else {
        setSheetError(
          error instanceof QuestionSaveError ? error.message : 'Não foi possível salvar a questão. Tente novamente.',
        );
      }
      busy.current = false;
      setSaving(false);
      return;
    }

    await onChanged();
    setSheet(null);
    busy.current = false;
    setSaving(false);
  }

  function handleDelete(question: ProfessorQuestion, position: number) {
    confirmDestructive({
      title: 'Excluir questão',
      message: `A questão ${position} e suas alternativas serão excluídas. Essa ação não pode ser desfeita.`,
      onConfirm: async () => {
        if (busy.current) return;
        busy.current = true;
        setNotice(undefined);
        setDeletingId(question.id);
        try {
          await deleteQuestion(activity, question.id);
          await onChanged();
        } catch {
          setNotice('Não foi possível excluir a questão. Tente novamente.');
        } finally {
          busy.current = false;
          setDeletingId(null);
        }
      },
    });
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <UmbrellaText variant="headline">Questões</UmbrellaText>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          {questions.length === 1 ? '1 questão' : `${questions.length} questões`} · {totalPoints}{' '}
          {totalPoints === 1 ? 'ponto' : 'pontos'} no total
        </UmbrellaText>
      </View>

      {notice ? (
        <UmbrellaText variant="caption" color={Colors.light.error}>
          {notice}
        </UmbrellaText>
      ) : null}

      <PrimaryButton
        label="Adicionar questão"
        icon="plus"
        iconPosition="leading"
        disabled={locked}
        onPress={() => openSheet({ mode: 'create' })}
      />

      {questions.length === 0 ? (
        <Card tone="muted">
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Esta atividade ainda não tem questões, então os alunos não conseguem respondê-la. Toque em &quot;Adicionar
            questão&quot; para criar a primeira.
          </UmbrellaText>
        </Card>
      ) : (
        questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            position={index + 1}
            disabled={locked}
            onEditPress={() => openSheet({ mode: 'edit', question })}
            onDeletePress={() => handleDelete(question, index + 1)}
          />
        ))
      )}

      <ModalSheet
        visible={sheet !== null}
        onClose={() => {
          if (!saving) setSheet(null);
        }}
        title={sheet?.mode === 'edit' ? 'Editar questão' : 'Nova questão'}>
        {sheet ? (
          <ScrollView
            style={{ maxHeight: height * 0.7 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <QuestionForm
              key={sheet.mode === 'edit' ? sheet.question.id : 'new'}
              question={sheet.mode === 'edit' ? sheet.question : undefined}
              submitLabel={sheet.mode === 'edit' ? 'Salvar questão' : 'Adicionar questão'}
              submitting={saving}
              submitError={sheetError}
              onSubmit={handleSubmit}
            />
          </ScrollView>
        ) : null}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
  },
});
