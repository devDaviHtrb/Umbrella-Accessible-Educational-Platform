import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';

import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useActivityDetail } from '@/hooks/api/activities/useActivity';
import type { StudentAnswerCorrectionDto } from '@/types/activities';

export default function ActivityQuizScreen() {
  const { courseId, moduleId, activityId } = useLocalSearchParams<{
    courseId: string;
    moduleId: string;
    activityId: string;
  }>();

  const {
    activity,
    latestSubmission,
    hasSubmitted,
    loading,
    error,
    submit,
  } = useActivityDetail(courseId ?? '', moduleId ?? '', activityId ?? '');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState<
    Record<number, { chosenAlternativeId?: number | null; essayAnswer?: string | null }>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const questions = activity?.questions || [];
  const currentQuestion = questions[currentIndex];

  // Pre-fill answers if user has already submitted
  useEffect(() => {
    if (latestSubmission && latestSubmission.answers) {
      const initialMap: Record<
        number,
        { chosenAlternativeId?: number | null; essayAnswer?: string | null }
      > = {};
      latestSubmission.answers.forEach((ans) => {
        initialMap[ans.questionId] = {
          chosenAlternativeId: ans.chosenAlternativeId,
          essayAnswer: ans.essayAnswer,
        };
      });
      setAnswersMap(initialMap);
    }
  }, [latestSubmission]);

  const handleSelectAlternative = (questionId: number, alternativeId: number) => {
    if (hasSubmitted) return;
    setAnswersMap((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        chosenAlternativeId: alternativeId,
      },
    }));
  };

  const handleEssayChange = (questionId: number, text: string) => {
    if (hasSubmitted) return;
    // Find the question to enforce maxLetters limit (handles paste scenarios)
    const q = questions.find((q) => q.id === questionId);
    const max = q?.essay?.maxLetters;
    const clipped = max && text.length > max ? text.slice(0, max) : text;
    setAnswersMap((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        essayAnswer: clipped,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!activity) return;

    // Build payload for all questions
    const formattedAnswers: StudentAnswerCorrectionDto[] = questions.map((q) => {
      const userAns = answersMap[q.id];
      return {
        questionId: q.id,
        chosenAlternativeId: userAns?.chosenAlternativeId ?? null,
        essayAnswer: userAns?.essayAnswer ?? null,
      };
    });

    // Check if any question is un-answered
    const unansweredCount = questions.filter((q) => {
      const ans = answersMap[q.id];
      if (q.alternatives && q.alternatives.length > 0) {
        return !ans?.chosenAlternativeId;
      }
      return !ans?.essayAnswer || ans.essayAnswer.trim().length === 0;
    }).length;

    // Check if any essay is below the minimum characters
    const belowMinCount = questions.filter((q) => {
      if (!q.essay?.minLetters) return false;
      const len = answersMap[q.id]?.essayAnswer?.length ?? 0;
      return len < q.essay.minLetters;
    }).length;

    if (belowMinCount > 0) {
      const msg = `${belowMinCount} resposta(s) discursiva(s) está(ão) abaixo do mínimo de caracteres exigido.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Resposta muito curta', msg);
      }
      return;
    }

    const performSubmission = async () => {
      setSubmitting(true);
      try {
        const result = await submit(formattedAnswers);
        if (result) {
          const successMsg = `Atividade Concluída!\nSua nota foi: ${result.score} de ${activity.maxScore} pontos.`;
          if (Platform.OS === 'web') {
            window.alert(successMsg);
          } else {
            Alert.alert('Atividade Concluída!', `Sua nota foi: ${result.score} de ${activity.maxScore} pontos.`);
          }
        }
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || 'Erro ao enviar submissão.';
        if (Platform.OS === 'web') {
          window.alert(`Erro: ${errorMsg}`);
        } else {
          Alert.alert('Erro', errorMsg);
        }
      } finally {
        setSubmitting(false);
      }
    };

    if (Platform.OS === 'web') {
      const promptMsg = unansweredCount > 0
        ? `Você possui ${unansweredCount} questão(ões) sem resposta. Deseja enviar assim mesmo?`
        : 'Deseja finalizar e enviar a atividade?';
      if (window.confirm(promptMsg)) {
        await performSubmission();
      }
    } else {
      if (unansweredCount > 0) {
        Alert.alert(
          'Atenção',
          `Você possui ${unansweredCount} questão(ões) sem resposta. Deseja enviar assim mesmo?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Enviar', onPress: performSubmission },
          ]
        );
      } else {
        Alert.alert('Confirmar Envio', 'Deseja finalizar e enviar a atividade?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sim, enviar', onPress: performSubmission },
        ]);
      }
    }
  };

  if (loading) {
    return (
      <ScreenContainer disableTopInset>
        <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: Spacing.xxl }} />
      </ScreenContainer>
    );
  }

  if (error || !activity || questions.length === 0) {
    return (
      <ScreenContainer disableTopInset>
        <Card>
          <UmbrellaText variant="title">Atividade não encontrada</UmbrellaText>
          <UmbrellaText variant="body" color={Colors.light.textSecondary} style={{ marginTop: Spacing.sm }}>
            {error || 'Não foi possível carregar as questões desta atividade.'}
          </UmbrellaText>
          <PrimaryButton label="Voltar" onPress={() => router.back()} style={{ marginTop: Spacing.lg }} />
        </Card>
      </ScreenContainer>
    );
  }

  // Find submitted answer for current question (if submitted)
  const submittedAnswerObj = latestSubmission?.answers?.find(
    (a) => a.questionId === currentQuestion.id
  );

  const handleReturnToCourse = () => {
    if (courseId) {
      router.replace({
        pathname: '/courses/[id]' as any,
        params: { id: courseId },
      });
    } else {
      router.push('/courses' as any);
    }
  };

  return (
    <ScreenContainer disableTopInset style={styles.container}>
      {/* Header Info Card */}
      <Card tone="muted" style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <UmbrellaText variant="label" color={Colors.light.primary}>
              {activity.test ? 'PROVA /AVALIAÇÃO' : 'EXERCÍCIO'}
            </UmbrellaText>
            <UmbrellaText variant="headline">{activity.title}</UmbrellaText>
          </View>
          {hasSubmitted ? (
            <View style={styles.scoreBadge}>
              <UmbrellaText variant="caption" color={Colors.light.surface} style={{ fontWeight: '700' }}>
                Nota: {latestSubmission?.score ?? 0} / {activity.maxScore}
              </UmbrellaText>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <UmbrellaText variant="caption" color={Colors.light.primary} style={{ fontWeight: '600' }}>
                Max {activity.maxScore} pts
              </UmbrellaText>
            </View>
          )}
        </View>
      </Card>

      {/* Stepper / Pagination Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepperRow}>
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIndex;
          const userAns = answersMap[q.id];
          const isAnswered = q.alternatives && q.alternatives.length > 0
            ? !!userAns?.chosenAlternativeId
            : !!(userAns?.essayAnswer && userAns.essayAnswer.trim().length > 0);

          return (
            <Pressable
              key={q.id}
              accessibilityRole="button"
              onPress={() => setCurrentIndex(idx)}
              style={[
                styles.stepChip,
                isCurrent && styles.stepChipActive,
                !isCurrent && isAnswered && styles.stepChipAnswered,
              ]}>
              <UmbrellaText
                variant="label"
                color={
                  isCurrent
                    ? Colors.light.surface
                    : isAnswered
                    ? Colors.light.primary
                    : Colors.light.textSecondary
                }>
                Q{idx + 1}
              </UmbrellaText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Main Question Card (One question per page) */}
      <Card style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <UmbrellaText variant="title" color={Colors.light.primary}>
            Questão {currentIndex + 1} de {questions.length}
          </UmbrellaText>

          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            Valha: {currentQuestion.points} {currentQuestion.points === 1 ? 'ponto' : 'pontos'}
          </UmbrellaText>
        </View>

        <UmbrellaText variant="bodyMedium" style={styles.statementText}>
          {currentQuestion.statement}
        </UmbrellaText>

        {/* Multiple Choice Alternatives */}
        {Array.isArray(currentQuestion.alternatives) && currentQuestion.alternatives.length > 0 ? (
          <View style={styles.alternativesList}>
            {currentQuestion.alternatives.map((alt) => {
              const isChosen = answersMap[currentQuestion.id]?.chosenAlternativeId === alt.id;
              const isCorrectAlt = alt.correct;

              let itemStyle = styles.alternativeItem;
              if (hasSubmitted) {
                if (isCorrectAlt) {
                  itemStyle = { ...styles.alternativeItem, ...styles.altCorrect };
                } else if (isChosen && !isCorrectAlt) {
                  itemStyle = { ...styles.alternativeItem, ...styles.altIncorrect };
                }
              } else if (isChosen) {
                itemStyle = { ...styles.alternativeItem, ...styles.altSelected };
              }

              return (
                <Pressable
                  key={alt.id}
                  accessibilityRole="button"
                  disabled={hasSubmitted}
                  onPress={() => handleSelectAlternative(currentQuestion.id, alt.id)}
                  style={itemStyle}>
                  <View
                    style={[
                      styles.letterBadge,
                      isChosen && !hasSubmitted && styles.letterBadgeSelected,
                      hasSubmitted && isCorrectAlt && styles.letterBadgeCorrect,
                    ]}>
                    <UmbrellaText
                      variant="label"
                      color={
                        (isChosen && !hasSubmitted) || (hasSubmitted && isCorrectAlt)
                          ? Colors.light.surface
                          : Colors.light.text
                      }>
                      {alt.letter || String.fromCharCode(65 + currentQuestion.alternatives!.indexOf(alt))}
                    </UmbrellaText>
                  </View>

                  <UmbrellaText variant="body" style={styles.altText}>
                    {alt.text}
                  </UmbrellaText>

                  {hasSubmitted && isCorrectAlt ? (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={Colors.light.success} />
                  ) : hasSubmitted && isChosen && !isCorrectAlt ? (
                    <IconSymbol name="xmark.circle.fill" size={20} color={Colors.light.error} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          /* Essay / Discursiva Question Input & Feedback */
          <View style={styles.essayContainer}>
            <UmbrellaText variant="label" color={Colors.light.textSecondary}>
              Sua Resposta:
            </UmbrellaText>
            <TextInput
              multiline
              numberOfLines={4}
              editable={!hasSubmitted}
              placeholder="Digite sua resposta aqui..."
              value={answersMap[currentQuestion.id]?.essayAnswer || ''}
              maxLength={currentQuestion.essay?.maxLetters ?? undefined}
              onChangeText={(text) => handleEssayChange(currentQuestion.id, text)}
              style={styles.essayInput}
            />

            {/* Character counter */}
            {(currentQuestion.essay?.maxLetters || currentQuestion.essay?.minLetters) && !hasSubmitted ? (
              <View style={styles.charCounterRow}>
                {currentQuestion.essay?.minLetters ? (
                  <UmbrellaText
                    variant="caption"
                    color={
                      (answersMap[currentQuestion.id]?.essayAnswer?.length ?? 0) >= currentQuestion.essay.minLetters
                        ? Colors.light.success
                        : Colors.light.textSecondary
                    }>
                    Mínimo: {currentQuestion.essay.minLetters} caracteres
                  </UmbrellaText>
                ) : <View />}
                {currentQuestion.essay?.maxLetters ? (
                  <UmbrellaText
                    variant="caption"
                    color={
                      (answersMap[currentQuestion.id]?.essayAnswer?.length ?? 0) >= currentQuestion.essay.maxLetters
                        ? Colors.light.error
                        : Colors.light.textSecondary
                    }>
                    {answersMap[currentQuestion.id]?.essayAnswer?.length ?? 0} / {currentQuestion.essay.maxLetters}
                  </UmbrellaText>
                ) : null}
              </View>
            ) : null}

            {/* Expected Answer Feedback (Shown ONLY after submission) */}
            {hasSubmitted && currentQuestion.essay?.expectedAnswer ? (
              <Card tone="muted" style={styles.expectedAnswerCard}>
                <View style={styles.expectedHeaderRow}>
                  <IconSymbol name="info.circle.fill" size={16} color={Colors.light.primary} />
                  <UmbrellaText variant="label" color={Colors.light.primary}>
                    Resposta Esperada pelo Professor:
                  </UmbrellaText>
                </View>
                <UmbrellaText variant="body" style={{ marginTop: Spacing.xs }}>
                  {currentQuestion.essay.expectedAnswer}
                </UmbrellaText>
              </Card>
            ) : null}
          </View>
        )}
      </Card>

      {/* Navigation Controls */}
      <View style={styles.navigationRow}>
        <Pressable
          accessibilityRole="button"
          disabled={currentIndex === 0}
          onPress={() => setCurrentIndex((prev) => prev - 1)}
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}>
          <IconSymbol
            name="chevron.left"
            size={18}
            color={currentIndex === 0 ? Colors.light.outline : Colors.light.primary}
          />
          <UmbrellaText
            variant="bodyMedium"
            color={currentIndex === 0 ? Colors.light.textSecondary : Colors.light.primary}>
            Anterior
          </UmbrellaText>
        </Pressable>

        {currentIndex < questions.length - 1 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setCurrentIndex((prev) => prev + 1)}
            style={styles.navButton}>
            <UmbrellaText variant="bodyMedium" color={Colors.light.primary}>
              Próxima
            </UmbrellaText>
            <IconSymbol name="chevron.right" size={18} color={Colors.light.primary} />
          </Pressable>
        ) : null}
      </View>

      {/* Submit / Finish Action */}
      {!hasSubmitted ? (
        <PrimaryButton
          label={submitting ? 'Enviando...' : 'Finalizar e Enviar Atividade'}
          onPress={handleSubmit}
          disabled={submitting}
          style={styles.submitButton}
        />
      ) : (
        <PrimaryButton
          label="Voltar para o Curso"
          onPress={handleReturnToCourse}
          style={styles.submitButton}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xxl,
  },
  headerCard: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  scoreBadge: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  pendingBadge: {
    backgroundColor: Colors.light.secondaryFixed,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  stepChip: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.outline,
  },
  stepChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  stepChipAnswered: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  questionCard: {
    marginBottom: Spacing.lg,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statementText: {
    marginBottom: Spacing.lg,
    fontSize: 16,
    lineHeight: 24,
  },
  alternativesList: {
    gap: Spacing.md,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.light.outline,
    backgroundColor: Colors.light.surface,
  },
  altSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  altCorrect: {
    borderColor: Colors.light.success,
    backgroundColor: '#E8F5E9',
  },
  altIncorrect: {
    borderColor: Colors.light.error,
    backgroundColor: '#FFEBEE',
  },
  letterBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBadgeSelected: {
    backgroundColor: Colors.light.primary,
  },
  letterBadgeCorrect: {
    backgroundColor: Colors.light.success,
  },
  altText: {
    flex: 1,
  },
  essayContainer: {
    gap: Spacing.sm,
  },
  charCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  essayInput: {
    borderWidth: 1,
    borderColor: Colors.light.outline,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    backgroundColor: Colors.light.surface,
    color: Colors.light.text,
  },
  expectedAnswerCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  expectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
});
