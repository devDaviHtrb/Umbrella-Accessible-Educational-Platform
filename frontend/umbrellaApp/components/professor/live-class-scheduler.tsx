import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormError } from '@/components/professor/form-error';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { COURSE_TEXT_MAX_LENGTH } from '@/constants/professor-options';
import { Colors, Spacing } from '@/constants/theme';
import { useSchedule } from '@/hooks/api/schedule/useSchedule';
import { useSubmit } from '@/hooks/use-submit';
import { EventType } from '@/types/schedule';
import { buildLiveClassSchedule } from '@/utils/live-class-schedule';

type SchedulerValues = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
};

const EMPTY_VALUES: SchedulerValues = { title: '', description: '', date: '', startTime: '', endTime: '' };

export function LiveClassScheduler({ courseId }: { courseId: string }) {
  const { createEvent } = useSchedule();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [scheduledLabel, setScheduledLabel] = useState<string | undefined>();

  const { submit, submitting, error } = useSubmit(
    async (payload: { title: string; description: string; startTime: string; endTime: string; label: string }) => {
      await createEvent({
        title: payload.title,
        description: payload.description,
        startTime: payload.startTime,
        endTime: payload.endTime,
        type: EventType.CLASSROOM,
        courseId: Number(courseId),
      });
      setValues(EMPTY_VALUES);
      setScheduledLabel(payload.label);
    },
    { errorMessage: 'Não foi possível agendar a aula. Tente novamente.', resetOnSuccess: true },
  );

  function update(field: keyof SchedulerValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setValidationError(undefined);
    setScheduledLabel(undefined);
  }

  function handleSubmit() {
    if (!values.title.trim()) {
      setValidationError('Preencha o título da aula.');
      return;
    }
    const schedule = buildLiveClassSchedule(values);
    if (!schedule.ok) {
      setValidationError(schedule.message);
      return;
    }
    submit({
      title: values.title.trim(),
      description: values.description.trim(),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      label: `${values.title.trim()} • ${values.date} às ${values.startTime}`,
    });
  }

  return (
    <Card style={styles.card}>
      <UmbrellaText variant="headline">Agendar aula</UmbrellaText>
      <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
        A aula é salva na agenda do curso e aparece para os alunos matriculados.
      </UmbrellaText>

      <View style={styles.fields}>
        <TextField
          label="Título"
          placeholder="Ex: Revisão para a prova"
          value={values.title}
          maxLength={COURSE_TEXT_MAX_LENGTH}
          onChangeText={(value) => update('title', value)}
        />
        <TextField
          label="Descrição (opcional)"
          value={values.description}
          multiline
          onChangeText={(value) => update('description', value)}
        />
        <TextField
          label="Data"
          placeholder="DD/MM/AAAA"
          value={values.date}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          onChangeText={(value) => update('date', value)}
        />
        <TextField
          label="Início"
          placeholder="HH:MM"
          value={values.startTime}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          onChangeText={(value) => update('startTime', value)}
        />
        <TextField
          label="Término"
          placeholder="HH:MM"
          value={values.endTime}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          onChangeText={(value) => update('endTime', value)}
        />
      </View>

      <FormError message={validationError ?? error} />

      {scheduledLabel ? (
        <UmbrellaText variant="caption" color={Colors.light.success} accessibilityRole="alert">
          Aula agendada: {scheduledLabel}
        </UmbrellaText>
      ) : null}

      <PrimaryButton
        label={submitting ? 'Agendando...' : 'Agendar aula'}
        onPress={handleSubmit}
        disabled={submitting}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  fields: {
    gap: Spacing.md,
  },
});
