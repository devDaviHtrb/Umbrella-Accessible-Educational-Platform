import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { GradeSubmissionInput, StudentSubmission } from '@/types/professor';

export type GradeSubmissionFormProps = {
  submission: StudentSubmission;
  submitting?: boolean;
  onSubmit: (input: GradeSubmissionInput) => void;
};

export function GradeSubmissionForm({ submission, submitting = false, onSubmit }: GradeSubmissionFormProps) {
  const [gradeText, setGradeText] = useState('');
  const [showError, setShowError] = useState(false);

  function handleSubmit() {
    const grade = Number(gradeText.trim().replace(',', '.'));
    if (gradeText.trim() === '' || Number.isNaN(grade) || grade < 0 || grade > submission.maxScore) {
      setShowError(true);
      return;
    }
    onSubmit({ grade });
  }

  return (
    <View style={styles.form}>
      <UmbrellaText variant="body" color={Colors.light.textSecondary}>
        {submission.studentName} · {submission.activityTitle}
      </UmbrellaText>

      <TextField
        label={`Nota (0 a ${submission.maxScore})`}
        placeholder="Ex: 8,5"
        keyboardType="decimal-pad"
        value={gradeText}
        onChangeText={(value) => {
          setGradeText(value);
          setShowError(false);
        }}
      />

      {showError ? (
        <UmbrellaText variant="caption" color={Colors.light.error}>
          Informe uma nota entre 0 e {submission.maxScore}.
        </UmbrellaText>
      ) : null}

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
});