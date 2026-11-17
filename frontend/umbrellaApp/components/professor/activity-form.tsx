import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChipField } from '@/components/professor/chip-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { professorActivityTypeOptions } from '@/constants/professor-options';
import { Colors, Spacing } from '@/constants/theme';
import type { ActivityType, ProfessorActivityInput, ProfessorModule } from '@/types/professor';

export type ActivityFormProps = {
  modules: ProfessorModule[];
  submitLabel?: string;
  submitting?: boolean;
  submitError?: string;
  onSubmit: (input: ProfessorActivityInput) => void;
};

export function ActivityForm({
  modules,
  submitLabel = 'Criar Atividade',
  submitting = false,
  submitError,
  onSubmit,
}: ActivityFormProps) {
  const [moduleId, setModuleId] = useState<string | null>(modules[0]?.id ?? null);
  const [type, setType] = useState<ActivityType>('entrega');
  const [title, setTitle] = useState('');
  const [showError, setShowError] = useState(false);

  const moduleOptions = modules.map((module) => ({
    id: module.id,
    label: `${module.number}. ${module.title}`,
  }));

  if (modules.length === 0) {
    return (
      <View style={styles.form}>
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Este curso ainda não tem módulos. Crie um módulo antes de adicionar atividades.
        </UmbrellaText>
      </View>
    );
  }

  function handleSubmit() {
    if (!moduleId || !title.trim()) {
      setShowError(true);
      return;
    }
    onSubmit({ moduleId, type, title: title.trim() });
  }

  return (
    <View style={styles.form}>
      <ChipField label="Módulo" options={moduleOptions} value={moduleId} onChange={setModuleId} />

      <ChipField
        label="Tipo de Atividade"
        options={professorActivityTypeOptions}
        value={type}
        onChange={setType}
      />

      <TextField
        label="Título"
        placeholder="Ex: Lista de Exercícios 1"
        value={title}
        onChangeText={(value) => {
          setTitle(value);
          setShowError(false);
        }}
      />

      {showError || submitError ? (
        <UmbrellaText variant="caption" color={Colors.light.error}>
          {showError ? 'Escolha o módulo e preencha o título para criar a atividade.' : submitError}
        </UmbrellaText>
      ) : null}

      <PrimaryButton
        label={submitting ? 'Criando...' : submitLabel}
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
});
