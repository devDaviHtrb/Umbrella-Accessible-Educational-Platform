import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChipField } from '@/components/professor/chip-field';
import { Checkbox } from '@/components/ui/checkbox';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import {
  MIN_QUESTION_ALTERNATIVES,
  professorQuestionKindOptions,
} from '@/constants/professor-options';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { alternativeLetter } from '@/hooks/api/professor/mappers';
import type { AlternativeDraft, ProfessorQuestion, ProfessorQuestionInput, QuestionKind } from '@/types/professor';
import {
  canAddAlternative,
  validateQuestionDraft,
  type QuestionErrors,
} from '@/utils/question-validation';

export type QuestionFormProps = {
  question?: ProfessorQuestion;
  submitLabel: string;
  submitting?: boolean;
  submitError?: string;
  onSubmit: (input: ProfessorQuestionInput) => void;
};

function emptyAlternatives(): AlternativeDraft[] {
  return Array.from({ length: MIN_QUESTION_ALTERNATIVES }, () => ({ text: '', correct: false }));
}

export function QuestionForm({
  question,
  submitLabel,
  submitting = false,
  submitError,
  onSubmit,
}: QuestionFormProps) {
  const [kind, setKind] = useState<QuestionKind>(question?.kind ?? 'multipla_escolha');
  const [statement, setStatement] = useState(question?.statement ?? '');
  const [points, setPoints] = useState(question ? String(question.points) : '');
  const [alternatives, setAlternatives] = useState<AlternativeDraft[]>(
    question && question.alternatives.length > 0
      ? question.alternatives.map((item) => ({ id: item.id, text: item.text, correct: item.correct }))
      : emptyAlternatives(),
  );
  const [expectedAnswer, setExpectedAnswer] = useState(question?.essay?.expectedAnswer ?? '');
  const [minLetters, setMinLetters] = useState(question?.essay?.minLetters?.toString() ?? '');
  const [maxLetters, setMaxLetters] = useState(question?.essay?.maxLetters?.toString() ?? '');
  const [errors, setErrors] = useState<QuestionErrors>({});

  const kindLocked = !!question?.kind;
  const kindLabel = professorQuestionKindOptions.find((option) => option.id === kind)?.label;

  function clear(...keys: (keyof QuestionErrors)[]) {
    setErrors((current) => {
      const next = { ...current };
      keys.forEach((key) => delete next[key]);
      return next;
    });
  }

  function updateAlternative(index: number, patch: Partial<AlternativeDraft>) {
    setAlternatives((current) => current.map((item, position) => (position === index ? { ...item, ...patch } : item)));
    clear('alternatives', 'emptyAlternatives');
  }

  function markCorrect(index: number, correct: boolean) {
    setAlternatives((current) =>
      current.map((item, position) => ({ ...item, correct: position === index ? correct : false })),
    );
    clear('alternatives');
  }

  function removeAlternative(index: number) {
    setAlternatives((current) => current.filter((_, position) => position !== index));
    clear('alternatives', 'emptyAlternatives');
  }

  function handleSubmit() {
    const result = validateQuestionDraft(
      { kind, statement, points, alternatives, expectedAnswer, minLetters, maxLetters },
      question?.essay,
    );

    setErrors(result.errors);
    if (result.input) onSubmit(result.input);
  }

  return (
    <View style={styles.form}>
      {kindLocked ? (
        <View style={styles.kindLocked}>
          <UmbrellaText variant="label" color={Colors.light.primary} style={styles.label}>
            Tipo de questão
          </UmbrellaText>
          <UmbrellaText variant="body">{kindLabel}</UmbrellaText>
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            O tipo de uma questão salva não pode ser alterado.
          </UmbrellaText>
        </View>
      ) : (
        <ChipField
          label="Tipo de questão"
          options={professorQuestionKindOptions}
          value={kind}
          onChange={(value) => {
            setKind(value);
            setErrors({});
          }}
        />
      )}

      <TextField
        label="Enunciado"
        placeholder="Escreva a pergunta"
        value={statement}
        multiline
        numberOfLines={3}
        style={styles.multiline}
        error={errors.statement}
        onChangeText={(value) => {
          setStatement(value);
          clear('statement');
        }}
      />

      <TextField
        label="Pontos"
        placeholder="Ex: 2"
        value={points}
        keyboardType="decimal-pad"
        error={errors.points}
        onChangeText={(value) => {
          setPoints(value);
          clear('points');
        }}
      />

      {kind === 'multipla_escolha' ? (
        <View style={styles.section}>
          <UmbrellaText variant="label" color={Colors.light.primary} style={styles.label}>
            Alternativas
          </UmbrellaText>
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            Marque a alternativa correta. Apenas uma pode ser a correta.
          </UmbrellaText>

          {alternatives.map((alternative, index) => (
            <View key={alternative.id ?? `new-${index}`} style={styles.alternative}>
              <View style={styles.alternativeHeader}>
                <View style={styles.letterBadge}>
                  <UmbrellaText variant="bodyMedium" color={Colors.light.primary}>
                    {alternativeLetter(index)}
                  </UmbrellaText>
                </View>
                <View style={styles.alternativeCheck}>
                  <Checkbox
                    checked={alternative.correct}
                    onChange={(checked) => markCorrect(index, checked)}
                    label="Correta"
                  />
                </View>
                {alternatives.length > MIN_QUESTION_ALTERNATIVES ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remover alternativa ${alternativeLetter(index)}`}
                    onPress={() => removeAlternative(index)}
                    hitSlop={8}
                    style={styles.removeButton}>
                    <IconSymbol name="xmark" size={16} color={Colors.light.error} />
                  </Pressable>
                ) : null}
              </View>

              <TextField
                label={`Alternativa ${alternativeLetter(index)}`}
                placeholder="Texto da alternativa"
                value={alternative.text}
                error={errors.emptyAlternatives?.includes(index) ? 'Preencha o texto.' : undefined}
                onChangeText={(value) => updateAlternative(index, { text: value })}
              />
            </View>
          ))}

          {errors.alternatives ? (
            <UmbrellaText variant="caption" color={Colors.light.error}>
              {errors.alternatives}
            </UmbrellaText>
          ) : null}

          {canAddAlternative(alternatives.length) ? (
            <SecondaryButton
              label="Adicionar alternativa"
              variant="filled"
              onPress={() => {
                setAlternatives((current) => [...current, { text: '', correct: false }]);
                clear('alternatives');
              }}
            />
          ) : null}
        </View>
      ) : (
        <View style={styles.section}>
          <TextField
            label="Resposta esperada"
            placeholder="Resposta usada como referência na correção"
            value={expectedAnswer}
            multiline
            numberOfLines={4}
            style={styles.multiline}
            error={errors.expectedAnswer}
            onChangeText={(value) => {
              setExpectedAnswer(value);
              clear('expectedAnswer');
            }}
          />

          <View style={styles.limits}>
            <View style={styles.limit}>
              <TextField
                label="Mín. de letras"
                placeholder="Opcional"
                value={minLetters}
                keyboardType="number-pad"
                error={errors.minLetters}
                onChangeText={(value) => {
                  setMinLetters(value);
                  clear('minLetters', 'maxLetters');
                }}
              />
            </View>
            <View style={styles.limit}>
              <TextField
                label="Máx. de letras"
                placeholder="Opcional"
                value={maxLetters}
                keyboardType="number-pad"
                error={errors.maxLetters}
                onChangeText={(value) => {
                  setMaxLetters(value);
                  clear('maxLetters');
                }}
              />
            </View>
          </View>
        </View>
      )}

      {submitError ? (
        <UmbrellaText variant="caption" color={Colors.light.error}>
          {submitError}
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
    gap: Spacing.lg,
  },
  label: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  kindLocked: {
    gap: Spacing.xs,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  section: {
    gap: Spacing.md,
  },
  alternative: {
    gap: Spacing.sm,
  },
  alternativeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  letterBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alternativeCheck: {
    flex: 1,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limits: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  limit: {
    flex: 1,
  },
});
