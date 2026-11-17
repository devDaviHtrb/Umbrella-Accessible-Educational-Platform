import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { QuestionCorrectionForm } from '@/components/professor/question-correction-form';
import { SegmentedTabs } from '@/components/professor/segmented-tabs';
import { LoadError } from '@/components/professor/load-error';
import { StudentRow } from '@/components/professor/student-row';
import { SubmissionRow } from '@/components/professor/submission-row';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import type { AnswerCorrectionInput, StudentSubmission, SubmissionCorrection } from '@/types/professor';

type StudentsTab = 'students' | 'submissions';

const tabOptions: { id: StudentsTab; label: string }[] = [
  { id: 'students', label: 'Alunos' },
  { id: 'submissions', label: 'Entregas' },
];

export default function ProfessorStudentsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { getSubmissions, getSubmissionCorrection, saveSubmissionCorrection, getStudents } = useProfessorCourses();
  const {
    data: submissions,
    loading: loadingSubmissions,
    error: submissionsError,
    reload: reloadSubmissions,
    retry: retrySubmissions,
  } = useFocusData(() => getSubmissions(courseId));
  const {
    data: students,
    loading: loadingStudents,
    error: studentsError,
    retry: retryStudents,
  } = useFocusData(() => getStudents(courseId));

  const [tab, setTab] = useState<StudentsTab>('students');
  const [gradingTarget, setGradingTarget] = useState<StudentSubmission | null>(null);
  const [correction, setCorrection] = useState<SubmissionCorrection | null>(null);
  const [loadingCorrection, setLoadingCorrection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gradeError, setGradeError] = useState<string | undefined>();

  async function handleOpenCorrection(submission: StudentSubmission) {
    setGradingTarget(submission);
    setCorrection(null);
    setGradeError(undefined);
    setLoadingCorrection(true);
    try {
      const data = await getSubmissionCorrection(courseId, submission);
      setCorrection(data);
    } catch {
      setGradeError('Não foi possível carregar as respostas desta entrega.');
    } finally {
      setLoadingCorrection(false);
    }
  }

  function handleCloseCorrection() {
    setGradingTarget(null);
    setCorrection(null);
    setGradeError(undefined);
  }

  async function handleSaveCorrection(answers: AnswerCorrectionInput[]) {
    if (!gradingTarget) return;
    setSaving(true);
    setGradeError(undefined);
    try {
      await saveSubmissionCorrection(courseId, gradingTarget, answers);
      await reloadSubmissions();
      handleCloseCorrection();
    } catch {
      setGradeError('Não foi possível salvar a correção. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
      <SegmentedTabs options={tabOptions} value={tab} onChange={setTab} />

      {tab === 'students' ? (
        <View style={styles.list}>
          {loadingStudents && !students ? (
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Carregando alunos...
            </UmbrellaText>
          ) : studentsError && !students ? (
            <LoadError message="Não foi possível carregar os alunos matriculados." onRetry={retryStudents} />
          ) : students && students.length > 0 ? (
            students.map((student) => <StudentRow key={student.id} student={student} />)
          ) : (
            <Card tone="muted">
              <UmbrellaText variant="body" color={Colors.light.textSecondary}>
                Nenhum aluno matriculado neste curso ainda.
              </UmbrellaText>
            </Card>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {loadingSubmissions ? (
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Carregando entregas...
            </UmbrellaText>
          ) : submissionsError && !submissions ? (
            <LoadError message="Não foi possível carregar as entregas." onRetry={retrySubmissions} />
          ) : submissions && submissions.length > 0 ? (
            submissions.map((submission) => (
              <SubmissionRow
                key={submission.id}
                submission={submission}
                onGradePress={() => handleOpenCorrection(submission)}
              />
            ))
          ) : (
            <Card tone="muted">
              <UmbrellaText variant="body" color={Colors.light.textSecondary}>
                Nenhuma entrega registrada neste curso ainda.
              </UmbrellaText>
            </Card>
          )}
        </View>
      )}

      <ModalSheet visible={gradingTarget !== null} onClose={handleCloseCorrection} title="Corrigir Entrega">
        {loadingCorrection ? (
          <View style={styles.modalLoading}>
            <ActivityIndicator color={Colors.light.primary} />
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Carregando respostas...
            </UmbrellaText>
          </View>
        ) : correction ? (
          <>
            <QuestionCorrectionForm
              key={correction.submissionId}
              correction={correction}
              submitting={saving}
              onSubmit={handleSaveCorrection}
            />
            {gradeError ? (
              <UmbrellaText variant="caption" color={Colors.light.error}>
                {gradeError}
              </UmbrellaText>
            ) : null}
          </>
        ) : gradeError ? (
          <UmbrellaText variant="body" color={Colors.light.error}>
            {gradeError}
          </UmbrellaText>
        ) : null}
      </ModalSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
  },
  list: {
    gap: Spacing.md,
  },
  modalLoading: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
});
