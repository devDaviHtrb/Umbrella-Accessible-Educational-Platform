import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChipField } from '@/components/professor/chip-field';
import { FileDropzone } from '@/components/professor/file-dropzone';
import { FormError } from '@/components/professor/form-error';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { materialFileRules } from '@/constants/material-files';
import { professorMaterialKindOptions } from '@/constants/professor-options';
import { Colors, Spacing } from '@/constants/theme';
import type { PickedFile } from '@/types/files';
import type { MaterialKind, ProfessorMaterialInput, ProfessorModule } from '@/types/professor';
import { fileBaseName, formatFileSize, resolveFileUrl } from '@/utils/files';

export type MaterialFormProps = {
  modules: ProfessorModule[];
  submitting?: boolean;
  submitError?: string;
  onSubmit: (inputs: ProfessorMaterialInput[]) => void;
};

export function MaterialForm({ modules, submitting = false, submitError, onSubmit }: MaterialFormProps) {
  const [moduleId, setModuleId] = useState<string | null>(modules[0]?.id ?? null);
  const [kind, setKind] = useState<MaterialKind>('documents');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [kindNotice, setKindNotice] = useState<string | null>(null);

  const moduleOptions = modules.map((module) => ({
    id: module.id,
    label: `${module.number}. ${module.title}`,
  }));

  if (modules.length === 0) {
    return (
      <View style={styles.form}>
        <UmbrellaText variant="body" color={Colors.light.textSecondary}>
          Este curso ainda não tem módulos. Crie um módulo antes de adicionar materiais.
        </UmbrellaText>
      </View>
    );
  }

  function handleKindChange(next: MaterialKind) {
    setKind(next);
    setError(null);

    const rule = materialFileRules[next];
    const kept = files.filter((file) => rule.extensions.includes(file.extension));
    const removed = files.length - kept.length;
    setFiles(kept);
    setKindNotice(
      removed > 0
        ? `${removed === 1 ? '1 arquivo não é compatível' : `${removed} arquivos não são compatíveis`} com ${rule.kindLabel} e ${removed === 1 ? 'foi removido' : 'foram removidos'} da lista.`
        : null,
    );
  }

  function handleFilesChange(next: PickedFile[]) {
    setFiles(next);
    setError(null);
    setKindNotice(null);
  }

  function handleSubmit() {
    if (!moduleId) {
      setError('Escolha o módulo do material.');
      return;
    }
    if (files.length === 0) {
      setError('Selecione ao menos um arquivo para adicionar.');
      return;
    }

    const inputs: ProfessorMaterialInput[] = [];
    for (const file of files) {
      const fileUrl = resolveFileUrl(file);
      if (!fileUrl) {
        setError(`Não foi possível ler o arquivo "${file.name}". Remova-o e selecione novamente.`);
        return;
      }
      inputs.push({
        moduleId,
        kind,
        title: files.length === 1 && title.trim() ? title.trim() : fileBaseName(file.name),
        description: description.trim(),
        url: fileUrl,
        fileName: file.name,
        fileSizeLabel: formatFileSize(file.size),
        mimeType: file.mimeType,
      });
    }
    onSubmit(inputs);
  }

  const submitLabel = files.length > 1 ? `Adicionar ${files.length} Materiais` : 'Adicionar Material';

  return (
    <View style={styles.form}>
      <ChipField label="Módulo" options={moduleOptions} value={moduleId} onChange={setModuleId} />

      <ChipField
        label="Tipo de Material"
        options={professorMaterialKindOptions}
        value={kind}
        onChange={handleKindChange}
      />

      <FileDropzone kind={kind} files={files} onChange={handleFilesChange} disabled={submitting} />
      <FormError message={kindNotice} />

      {files.length > 1 ? (
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          Cada arquivo será adicionado como um material, usando o nome do arquivo como título.
        </UmbrellaText>
      ) : (
        <TextField
          label="Título (opcional)"
          placeholder={files[0] ? fileBaseName(files[0].name) : 'Ex: Apostila — Limites e Continuidade'}
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setError(null);
          }}
        />
      )}

      <TextField
        label="Descrição (opcional)"
        placeholder="Quando e como os alunos devem usar este material?"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={styles.multiline}
      />

      <FormError message={error ?? submitError} />

      <PrimaryButton
        label={submitting ? 'Adicionando...' : submitLabel}
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
    minHeight: 90,
  },
});