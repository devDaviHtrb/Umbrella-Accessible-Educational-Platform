import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { StyleSheet, View } from 'react-native';

import { DropzoneSurface } from '@/components/professor/dropzone-surface';
import { FormError } from '@/components/professor/form-error';
import { PickedFileList } from '@/components/professor/picked-file-list';
import { materialFileRules } from '@/constants/material-files';
import { Spacing } from '@/constants/theme';
import type { FileDropzoneProps } from '@/types/files';
import { acceptMaterialFiles, describeAcceptedFormats } from '@/utils/files';

function hasFiles(event: DragEvent<HTMLDivElement>): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

export function FileDropzone({ kind, files, onChange, disabled = false, maxFiles }: FileDropzoneProps) {
  const single = maxFiles === 1;
  const rule = materialFileRules[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const accept = rule.extensions.map((extension) => `.${extension}`).join(',');

  function openPicker() {
    if (!disabled) inputRef.current?.click();
  }

  function addFiles(incoming: File[]) {
    if (incoming.length === 0) return;

    const { accepted, errors: rejected } = acceptMaterialFiles(
      incoming.map((file) => ({ name: file.name, size: file.size, type: file.type, blob: file })),
      kind,
      single ? [] : files,
    );

    setErrors(rejected);
    if (accepted.length > 0) onChange(single ? accepted.slice(0, 1) : [...files, ...accepted]);
  }

  function removeFile(id: string) {
    setErrors([]);
    onChange(files.filter((file) => file.id !== id));
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    addFiles(selected);
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setErrors([]);
    setDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (disabled || !hasFiles(event)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (disabled) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <View style={styles.root}>
      <div
        data-testid="material-dropzone"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}>
        <DropzoneSurface
          title={
            dragging
              ? 'Solte os arquivos para adicioná-los'
              : 'Arraste seus arquivos aqui ou clique para selecionar'
          }
          caption={describeAcceptedFormats(kind)}
          accessibilityLabel="Selecionar arquivos do computador"
          active={dragging}
          disabled={disabled}
          onPress={openPicker}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={!single}
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleInputChange}
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