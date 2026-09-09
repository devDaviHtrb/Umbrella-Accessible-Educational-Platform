import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Checkbox } from '@/components/ui/checkbox';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { NewReminderInput } from '@/types/agenda';

export type NewReminderFormProps = {
  onSubmit: (input: NewReminderInput) => void;
};

export function NewReminderForm({ onSubmit }: NewReminderFormProps) {
  const [title, setTitle] = useState('');
  const [dueLabel, setDueLabel] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [showError, setShowError] = useState(false);

  function handleSubmit() {
    if (!title.trim() || !dueLabel.trim()) {
      setShowError(true);
      return;
    }
    onSubmit({ title: title.trim(), dueLabel: dueLabel.trim(), urgent });
  }

  return (
    <View style={styles.form}>
      <TextField
        label="Título"
        placeholder="Ex: Entrega do projeto"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          setShowError(false);
        }}
      />
      <TextField
        label="Prazo"
        placeholder="Ex: Amanhã, 10:00"
        value={dueLabel}
        onChangeText={(value) => {
          setDueLabel(value);
          setShowError(false);
        }}
      />
      <Checkbox checked={urgent} onChange={setUrgent} label="Marcar como urgente" />

      {showError ? (
        <UmbrellaText variant="caption" color={Colors.light.error}>
          Preencha o título e o prazo para salvar o lembrete.
        </UmbrellaText>
      ) : null}

      <PrimaryButton label="Salvar Lembrete" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.lg,
  },
});