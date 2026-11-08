import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ChipField } from '@/components/professor/chip-field';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { COURSE_TEXT_MAX_LENGTH, professorDifficultyOptions } from '@/constants/professor-options';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { CourseDifficulty, ProfessorCategory, ProfessorCourseInput } from '@/types/professor';

type PickedImage = {
  localUri: string;
  mimeType?: string;
  fileName?: string;
};

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
  const [difficulty, setDifficulty] = useState<CourseDifficulty>(initialValues?.difficultyLevel ?? 1);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>(initialValues?.imageUrl);
  const [showError, setShowError] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | undefined>();
  const readOnly = !!readOnlyNotice;

  const previewUri = pickedImage?.localUri ?? existingImageUrl;

  async function handlePickImage() {
    if (readOnly) return;

    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Autorize o acesso à galeria para escolher a imagem do curso.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPickedImage({
        localUri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName ?? undefined,
      });
    }
  }

  function handleRemoveImage() {
    setPickedImage(null);
    setExistingImageUrl(undefined);
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
      difficultyLevel: difficulty,
      imageUrl: existingImageUrl,
      imageLocalUri: pickedImage?.localUri,
      imageMimeType: pickedImage?.mimeType,
      imageFileName: pickedImage?.fileName,
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

      <ChipField
        label="Nível de dificuldade"
        options={professorDifficultyOptions.map((option) => ({ id: String(option.id), label: option.label }))}
        value={String(difficulty)}
        onChange={(id) => {
          if (!readOnly) setDifficulty(Number(id) as CourseDifficulty);
        }}
      />

      <View style={styles.imageSection}>
        <UmbrellaText variant="label" color={Colors.light.primary} style={styles.imageLabel}>
          Imagem do curso
        </UmbrellaText>

        {previewUri ? (
          <View style={styles.preview}>
            <Image source={{ uri: previewUri }} style={styles.previewImage} contentFit="cover" />
            {!readOnly ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remover imagem do curso"
                onPress={handleRemoveImage}
                hitSlop={8}
                style={styles.removeImage}>
                <IconSymbol name="xmark" size={16} color={Colors.light.surface} />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            Opcional. Escolha uma imagem de capa para o curso (proporção 16:9 funciona melhor).
          </UmbrellaText>
        )}

        {!readOnly ? (
          <SecondaryButton
            label={previewUri ? 'Trocar imagem' : 'Escolher imagem'}
            onPress={handlePickImage}
          />
        ) : null}
      </View>

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
  imageSection: {
    gap: Spacing.md,
  },
  imageLabel: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  preview: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImage: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(17, 24, 28, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});