import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChipField } from '@/components/professor/chip-field';
import { FormError } from '@/components/professor/form-error';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { professorActivityTypeOptions } from '@/constants/professor-options';
import { Spacing } from '@/constants/theme';
import type { ActivityType } from '@/types/professor';

export type ActivityDetailsValues = {
  title: string;
  type: ActivityType;
};

export type ActivityDetailsFormProps = {
  initialValues: ActivityDetailsValues;
  submitting?: boolean;
  submitError?: string;
  onSubmit: (values: ActivityDetailsValues) => void;
};

export function ActivityDetailsForm({
  initialValues,
  submitting = false,
  submitError,
  onSubmit,
}: ActivityDetailsFormProps) {
  const [type, setType] = useState<ActivityType>(initialValues.type);
  const [title, setTitle] = useState(initialValues.title);
  const [showError, setShowError] = useState(false);

  const unchanged = title.trim() === initialValues.title && type === initialValues.type;

  function handleSubmit() {
    if (!title.trim()) {
      setShowError(true);
      return;
    }
    onSubmit({ title: title.trim(), type });
  }

  return (
    <View style={styles.form}>
      <TextField
        label="Título"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          setShowError(false);
        }}
      />

      <ChipField
        label="Tipo de Atividade"
        options={professorActivityTypeOptions}
        value={type}
        onChange={setType}
      />

      <FormError message={showError ? 'Preencha o título da atividade para salvar.' : submitError} />

      <PrimaryButton
        label={submitting ? 'Salvando...' : 'Salvar dados da atividade'}
        onPress={handleSubmit}
        disabled={submitting || unchanged}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
});
