import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { GradeSubmissionForm } from '@/components/professor/grade-submission-form';
import { SegmentedTabs } from '@/components/professor/segmented-tabs';
import { LoadError } from '@/components/professor/load-error';
import { SubmissionRow } from '@/components/professor/submission-row';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useProfessorCourses } from '@/hooks/api/professor/useProfessorCourses';
import { useFocusData } from '@/hooks/use-focus-data';
import type { GradeSubmissionInput, ProfessorActivityDetail, StudentSubmission } from '@/types/professor';

type StudentsTab = 'students' | 'submissions';

const tabOptions: { id: StudentsTab; label: string }[] = [
  { id: 'students', label: 'Alunos' },
  { id: 'submissions', label: 'Entregas' },
];

export default function ProfessorStudentsScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { getSubmissions, getStudents, gradeSubmission } = useProfessorCourses();
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

  const { getActivity } = useProfessorCourses();
  const { height } = useWindowDimensions();

  const [tab, setTab] = useState<StudentsTab>('students');
  const [gradingTarget, setGradingTarget] = useState<StudentSubmission | null>(null);
  const [saving, setSaving] = useState(false);
  const [gradeError, setGradeError] = useState<string | undefined>();

  const [reviewActivity, setReviewActivity] = useState<ProfessorActivityDetail | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    if (!gradingTarget) {
      setReviewActivity(null);
      setLoadingReview(false);
      return;
    }

    let active = true;
    setLoadingReview(true);
    setReviewActivity(null);
    getActivity(courseId, gradingTarget.activityId)
      .then((activity) => {
        if (active) setReviewActivity(activity ?? null);
      })
      .catch(() => {
        if (active) setReviewActivity(null);
      })
      .finally(() => {
        if (active) setLoadingReview(false);
      });

    return () => {
      active = false;
    };
  }, [gradingTarget, courseId, getActivity]);

  async function handleGrade(input: GradeSubmissionInput) {
    if (!gradingTarget) return;
    setSaving(true);
    setGradeError(undefined);
    try {
      await gradeSubmission(courseId, gradingTarget, input);
      await reloadSubmissions();
      setGradingTarget(null);
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
          {loadingStudents ? (
            <UmbrellaText variant="body" color={Colors.light.textSecondary}>
              Carregando alunos...
            </UmbrellaText>
          ) : studentsError && !students ? (
            <LoadError message="Não foi possível carregar os alunos." onRetry={retryStudents} />
          ) : students && students.length > 0 ? (
            students.map((student) => (
              <Card key={student.id} style={styles.studentCard}>
                <UmbrellaText variant="bodyMedium" numberOfLines={1}>
                  {student.name}
                </UmbrellaText>
                {student.email ? (
                  <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={1}>
                    {student.email}
                  </UmbrellaText>
                ) : null}
              </Card>
            ))
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
                onGradePress={() => setGradingTarget(submission)}
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

      <ModalSheet
        visible={gradingTarget !== null}
        onClose={() => {
          setGradingTarget(null);
          setGradeError(undefined);
        }}
        title="Corrigir Entrega">
        {gradingTarget ? (
          <ScrollView
            style={{ maxHeight: height * 0.7 }}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {loadingReview ? (
              <View style={styles.reviewLoading}>
                <ActivityIndicator color={Colors.light.primary} />
                <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                  Carregando respostas...
                </UmbrellaText>
              </View>
            ) : reviewActivity ? (
              <GradeSubmissionForm
                key={gradingTarget.id}
                submission={gradingTarget}
                activity={reviewActivity}
                submitting={saving}
                onSubmit={handleGrade}
              />
            ) : (
              <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                Não foi possível carregar as respostas desta entrega. Tente fechar e abrir novamente.
              </UmbrellaText>
            )}

            {gradeError ? (
              <UmbrellaText variant="caption" color={Colors.light.error}>
                {gradeError}
              </UmbrellaText>
            ) : null}
          </ScrollView>
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
  studentCard: {
    gap: Spacing.xs,
  },
  modalContent: {
    gap: Spacing.lg,
  },
  reviewLoading: {
    gap: Spacing.sm,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
});