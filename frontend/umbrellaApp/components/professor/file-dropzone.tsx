import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DropzoneSurface } from '@/components/professor/dropzone-surface';
import { FormError } from '@/components/professor/form-error';
import { PickedFileList } from '@/components/professor/picked-file-list';
import { Spacing } from '@/constants/theme';
import type { FileDropzoneProps } from '@/types/files';
import { describeAcceptedFormats } from '@/utils/files';
import { pickMaterialDocuments } from '@/utils/pick-documents';

export function FileDropzone({ kind, files, onChange, disabled = false, maxFiles }: FileDropzoneProps) {
  const single = maxFiles === 1;
  const picking = useRef(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function openPicker() {
    if (disabled || picking.current) return;

    picking.current = true;
    setErrors([]);

    try {
      const outcome = await pickMaterialDocuments(kind, single ? [] : files, !single);
      if (outcome.canceled) return;

      setErrors(outcome.errors);
      if (outcome.accepted.length > 0) onChange(single ? outcome.accepted.slice(0, 1) : [...files, ...outcome.accepted]);
    } catch {
      setErrors(['Não foi possível abrir o seletor de arquivos. Tente novamente.']);
    } finally {
      picking.current = false;
    }
  }

  function removeFile(id: string) {
    setErrors([]);
    onChange(files.filter((file) => file.id !== id));
  }

  return (
    <View style={styles.root}>
      <DropzoneSurface
        title="Toque para selecionar seus arquivos"
        caption={describeAcceptedFormats(kind)}
        accessibilityLabel="Selecionar arquivos do dispositivo"
        disabled={disabled}
        onPress={openPicker}
      />

      {errors.map((message) => (
        <FormError key={message} message={message} />
      ))}

      <PickedFileList files={files} onRemove={removeFile} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.md,
  },
});