import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { PickedFile } from '@/types/files';
import { formatFileSize } from '@/utils/files';

const FILE_ICON: Record<string, IconSymbolName> = {
  pdf: 'doc.fill',
  doc: 'doc.fill',
  docx: 'doc.fill',
  odt: 'doc.fill',
  ppt: 'doc.richtext.fill',
  pptx: 'doc.richtext.fill',
  odp: 'doc.richtext.fill',
  jpg: 'photo',
  jpeg: 'photo',
  png: 'photo',
  xlsx: 'tablecells',
  mp4: 'video.fill',
};

export type PickedFileListProps = {
  files: PickedFile[];
  onRemove: (id: string) => void;
  disabled?: boolean;
};

export function PickedFileList({ files, onRemove, disabled = false }: PickedFileListProps) {
  if (files.length === 0) return null;

  return (
    <View style={styles.list}>
      <UmbrellaText variant="label" color={Colors.light.primary} style={styles.listLabel}>
        {`Arquivos selecionados (${files.length})`}
      </UmbrellaText>

      {files.map((file) => (
        <Card key={file.id} style={styles.fileRow}>
          <View style={styles.fileIcon}>
            <IconSymbol
              name={FILE_ICON[file.extension] ?? 'doc.fill'}
              size={18}
              color={Colors.light.primary}
            />
          </View>

          <View style={styles.fileText}>
            <UmbrellaText variant="bodyMedium" numberOfLines={1}>
              {file.name}
            </UmbrellaText>
            <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
              {`${file.extension.toUpperCase()} • ${formatFileSize(file.size)}`}
            </UmbrellaText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remover arquivo ${file.name}`}
            onPress={() => onRemove(file.id)}
            disabled={disabled}
            hitSlop={8}
            style={styles.removeButton}>
            <IconSymbol name="xmark" size={16} color={Colors.light.textSecondary} />
          </Pressable>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.sm,
  },
  listLabel: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileText: {
    flex: 1,
    gap: Spacing.xs,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});