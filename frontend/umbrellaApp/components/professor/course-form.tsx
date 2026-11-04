import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChipField } from '@/components/professor/chip-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { COURSE_TEXT_MAX_LENGTH } from '@/constants/professor-options';
import { Colors, Spacing } from '@/constants/theme';
import type { ProfessorCategory, ProfessorCourseInput } from '@/types/professor';

export type CourseFormProps = {
  categories: ProfessorCategory[];
  onCreateCategory?: (name: string) => Promise<string>;
  initialValues?: ProfessorCourseInput;
  submitLabel?: string;
  readOnlyNotice?: string;
  submitting?: boolean;
  submitError?: string;
  onSubmit?: (input: ProfessorCourseInput) => void;
};

export function CourseForm({
  categories,
  onCreateCategory,
  initialValues,
  submitLabel,
  readOnlyNotice,
  submitting = false,
  submitError,
  onSubmit,
}: CourseFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [categoryId, setCategoryId] = useState<string>(
    initialValues?.categoryId ?? categories[0]?.id ?? '',
  );
  const [showError, setShowError] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | undefined>();
  const readOnly = !!readOnlyNotice;

  async function handleCreateCategory() {
    const name = newCategory.trim();
    if (!onCreateCategory || !name) return;
    if (categories.some((category) => category.label.trim().toLowerCase() === name.toLowerCase())) {
      setCategoryError('Essa categoria já existe.');
      return;
    }
    setCreatingCategory(true);
    setCategoryError(undefined);
    try {
      setCategoryId(await onCreateCategory(name));
      setNewCategory('');
    } catch {
      setCategoryError('Não foi possível criar a categoria. Tente novamente.');
    } finally {
      setCreatingCategory(false);
    }
  }

  function handleSubmit() {
    if (!title.trim() || !categoryId) {
      setShowError(true);
      return;
    }
    onSubmit?.({
      title: title.trim(),
      description: description.trim(),
      categoryId,
    });
  }

  return (
    <View style={styles.form}>
      <TextField
        label="Título do Curso"
        placeholder="Ex: Cálculo Avançado"
        value={title}
        editable={!readOnly}
        maxLength={COURSE_TEXT_MAX_LENGTH}
        onChangeText={(value) => {
          setTitle(value);
          setShowError(false);
        }}
      />

      {categories.length > 0 ? (
        <ChipField
          label="Categoria"
          options={categories}
          value={categoryId}
          onChange={(id) => {
            if (!readOnly) setCategoryId(id);
          }}
        />
      ) : (
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Nenhuma categoria cadastrada ainda. Crie a primeira categoria para poder criar o curso.
        </UmbrellaText>
      )}

      {onCreateCategory ? (
        <View style={styles.categoryCreator}>
          <TextField
            label="Nova categoria"
            placeholder="Ex: Matemática"
            value={newCategory}
            maxLength={COURSE_TEXT_MAX_LENGTH}
            onChangeText={(value) => {
              setNewCategory(value);
              setCategoryError(undefined);
            }}
          />
          {categoryError ? (
            <UmbrellaText variant="caption" color={Colors.light.error}>
              {categoryError}
            </UmbrellaText>
          ) : null}
          <SecondaryButton
            label={creatingCategory ? 'Criando...' : 'Adicionar categoria'}
            onPress={handleCreateCategory}
            disabled={creatingCategory || !newCategory.trim()}
          />
        </View>
      ) : null}

      <TextField
        label="Descrição"
        placeholder="Sobre o que é este curso?"
        value={description}
        onChangeText={setDescription}
        editable={!readOnly}
        maxLength={COURSE_TEXT_MAX_LENGTH}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={styles.multiline}
      />

      <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
        {description.length}/{COURSE_TEXT_MAX_LENGTH} caracteres na descrição
      </UmbrellaText>

      {readOnly ? (
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          {readOnlyNotice}
        </UmbrellaText>
      ) : (
        <>
          {showError || submitError ? (
            <UmbrellaText variant="caption" color={Colors.light.error}>
              {showError ? 'Preencha o título e escolha uma categoria para salvar.' : submitError}
            </UmbrellaText>
          ) : null}

          <PrimaryButton
            label={submitting ? 'Salvando...' : (submitLabel ?? 'Salvar')}
            onPress={handleSubmit}
            disabled={submitting}
          />
        </>
      )}
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
  categoryCreator: {
    gap: Spacing.md,
  },
});