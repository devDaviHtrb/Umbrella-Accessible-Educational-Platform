import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ChipField } from '@/components/professor/chip-field';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { COURSE_TEXT_MAX_LENGTH } from '@/constants/professor-options';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ProfessorCategory, ProfessorCourseInput } from '@/types/professor';

export type CoursePickedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export type CourseFormSubmit = ProfessorCourseInput & {
  pickedImage?: CoursePickedImage;
};

export type CourseFormProps = {
  categories: ProfessorCategory[];
  onCreateCategory?: (name: string) => Promise<string>;
  initialValues?: ProfessorCourseInput;
  initialImageUrl?: string;
  submitLabel?: string;
  readOnlyNotice?: string;
  submitting?: boolean;
  submitError?: string;
  onSubmit?: (input: CourseFormSubmit) => void;
};

export function CourseForm({
  categories,
  onCreateCategory,
  initialValues,
  initialImageUrl,
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
  const [pickedImage, setPickedImage] = useState<CoursePickedImage | null>(null);
  const [showError, setShowError] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | undefined>();
  const readOnly = !!readOnlyNotice;

  const previewUri = pickedImage?.uri ?? initialImageUrl;

  useEffect(() => {
    if (!readOnly && !categories.some((category) => category.id === categoryId)) {
      setCategoryId(categories[0]?.id ?? '');
    }
  }, [categories, categoryId, readOnly]);

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para escolher a capa do curso.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPickedImage({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType });
    }
  }

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
      pickedImage: pickedImage ?? undefined,
    });
  }

  return (
    <View style={styles.form}>
      {!readOnly ? (
        <View style={styles.imageField}>
          <UmbrellaText variant="label" color={Colors.light.textSecondary}>
            Capa do curso
          </UmbrellaText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={previewUri ? 'Trocar a capa do curso' : 'Adicionar capa do curso'}
            onPress={handlePickImage}
            style={styles.imagePicker}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <IconSymbol name="photo" size={28} color={Colors.light.primary} />
                <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                  Toque para adicionar uma imagem
                </UmbrellaText>
              </View>
            )}
          </Pressable>
          {previewUri ? (
            <SecondaryButton
              label={pickedImage ? 'Trocar imagem selecionada' : 'Trocar capa'}
              onPress={handlePickImage}
            />
          ) : null}
        </View>
      ) : null}

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
  imageField: {
    gap: Spacing.sm,
  },
  imagePicker: {
    width: '100%',
    height: 160,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.light.outline,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : null),
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
});
