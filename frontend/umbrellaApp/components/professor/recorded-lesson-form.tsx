import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChipField } from '@/components/professor/chip-field';
import { FileDropzone } from '@/components/professor/file-dropzone';
import { FormError } from '@/components/professor/form-error';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { COURSE_TEXT_MAX_LENGTH } from '@/constants/professor-options';
import { Colors, Spacing } from '@/constants/theme';
import type { PickedFile } from '@/types/files';
import type { ProfessorCourse, ProfessorMaterialInput, ProfessorModule } from '@/types/professor';
import { formatFileSize, resolveFileUrl } from '@/utils/files';

export type RecordedLessonFormProps = {
  courses: ProfessorCourse[];
  courseId: string | null;
  onCourseChange: (courseId: string) => void;
  modules: ProfessorModule[] | null;
  modulesFailed: boolean;
  submitting?: boolean;
  progress?: number;
  submitError?: string;
  onSubmit: (input: ProfessorMaterialInput) => void;
};

export function RecordedLessonForm({
  courses,
  courseId,
  onCourseChange,
  modules,
  modulesFailed,
  submitting = false,
  progress = 0,
  submitError,
  onSubmit,
}: RecordedLessonFormProps) {
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setModuleId(modules?.[0]?.id ?? null);
  }, [modules]);

  const courseOptions = courses.map((course) => ({ id: course.id, label: course.title }));
  const moduleOptions = (modules ?? []).map((module) => ({
    id: module.id,
    label: `${module.number}. ${module.title}`,
  }));

  function handleSubmit() {
    if (!courseId || !moduleId) {
      setError('Escolha o curso e o módulo da aula.');
      return;
    }
    if (!title.trim()) {
      setError('Informe o título da aula.');
      return;
    }
    const file = files[0];
    if (!file) {
      setError('Selecione o vídeo MP4 da aula.');
      return;
    }
    const fileUrl = resolveFileUrl(file);
    if (!fileUrl) {
      setError(`Não foi possível ler o arquivo "${file.name}". Remova-o e selecione novamente.`);
      return;
    }

    onSubmit({
      moduleId,
      kind: 'videos',
      title: title.trim(),
      description: description.trim(),
      url: fileUrl,
      fileName: file.name,
      fileSizeLabel: formatFileSize(file.size),
      mimeType: file.mimeType,
    });
  }

  if (courses.length === 0) {
    return (
      <UmbrellaText variant="body" color={Colors.light.textSecondary}>
        Você ainda não tem cursos. Crie um curso e um módulo antes de cadastrar aulas gravadas.
      </UmbrellaText>
    );
  }

  return (
    <View style={styles.form}>
      <ChipField label="Curso" options={courseOptions} value={courseId} onChange={onCourseChange} />

      {modulesFailed ? (
        <FormError message="Não foi possível carregar os módulos deste curso." />
      ) : modules === null ? (
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Carregando módulos...
        </UmbrellaText>
      ) : modules.length === 0 ? (
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Este curso ainda não tem módulos. Crie um módulo antes de cadastrar aulas gravadas.
        </UmbrellaText>
      ) : (
        <ChipField label="Módulo" options={moduleOptions} value={moduleId} onChange={setModuleId} />
      )}

      <TextField
        label="Título da aula"
        placeholder="Ex: Alfabeto em Libras"
        value={title}
        maxLength={COURSE_TEXT_MAX_LENGTH}
        onChangeText={(value) => {
          setTitle(value);
          setError(null);
        }}
      />

      <TextField
        label="Descrição (opcional)"
        placeholder="O que o aluno vai aprender nesta aula?"
        value={description}
        maxLength={COURSE_TEXT_MAX_LENGTH}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={styles.multiline}
      />

      <FileDropzone
        kind="videos"
        maxFiles={1}
        files={files}
        onChange={(next) => {
          setFiles(next);
          setError(null);
        }}
        disabled={submitting}
      />

      {submitting ? (
        <View style={styles.progress}>
          <ProgressBar progress={progress} />
          <UmbrellaText variant="caption" color={Colors.light.textSecondary} accessibilityRole="progressbar">
            Enviando vídeo... {progress}%
          </UmbrellaText>
        </View>
      ) : null}

      <FormError message={error ?? submitError} />

      <PrimaryButton
        label={submitting ? 'Enviando...' : 'Enviar Aula Gravada'}
        onPress={handleSubmit}
        disabled={submitting || modules === null || modules.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.xl,
  },
  multiline: {
    minHeight: 90,
  },
  progress: {
    gap: Spacing.sm,
  },
});
