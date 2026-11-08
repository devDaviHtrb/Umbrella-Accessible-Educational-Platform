import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { COURSE_TEXT_MAX_LENGTH } from '@/constants/professor-options';
import { Colors, Spacing } from '@/constants/theme';
import type { ProfessorModuleInput } from '@/types/professor';

export type ModuleFormProps = {
  initialValues?: ProfessorModuleInput;
  submitLabel: string;
  submitting?: boolean;
  submitError?: string;
  descriptionHint?: string;
  onSubmit: (input: ProfessorModuleInput) => void;
};

export function ModuleForm({
  initialValues,
  submitLabel,
  submitting = false,
  submitError,
  descriptionHint,
  onSubmit,
}: ModuleFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [showError, setShowError] = useState(false);

  function handleSubmit() {
    if (!title.trim()) {
      setShowError(true);
      return;
    }
    onSubmit({ title: title.trim(), description: description.trim() });
  }

  return (
    <View style={styles.form}>
      <TextField
        label="Título do Módulo"
        placeholder="Ex: Limites e Continuidade"
        value={title}
        maxLength={COURSE_TEXT_MAX_LENGTH}
        onChangeText={(value) => {
          setTitle(value);
          setShowError(false);
        }}
      />

      <TextField
        label="Descrição"
        placeholder="O que os alunos vão ver neste módulo?"
        value={description}
        onChangeText={setDescription}
        maxLength={COURSE_TEXT_MAX_LENGTH}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={styles.multiline}
      />

      <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
        {description.length}/{COURSE_TEXT_MAX_LENGTH} caracteres na descrição
      </UmbrellaText>

      {descriptionHint ? (
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          {descriptionHint}
        </UmbrellaText>
      ) : null}

      {showError || submitError ? (
        <UmbrellaText variant="caption" color={Colors.light.error}>
          {showError ? 'Preencha o título do módulo para salvar.' : submitError}
        </UmbrellaText>
      ) : null}

      <PrimaryButton
        label={submitting ? 'Salvando...' : submitLabel}
        onPress={handleSubmit}
        disabled={submitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.xl,
  },
  multiline: {
    minHeight: 110,
  },
});