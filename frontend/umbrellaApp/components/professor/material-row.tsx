import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { MaterialKind, ProfessorMaterial } from '@/types/professor';
import { displayHost } from '@/utils/url';

const KIND_ICON: Record<MaterialKind, IconSymbolName> = {
  documents: 'doc.fill',
  slides: 'doc.richtext.fill',
  images: 'photo',
  spreadsheets: 'tablecells',
  videos: 'video.fill',
};

export type MaterialRowProps = {
  material: ProfessorMaterial;
  onOpenPress: () => void;
  onDeletePress?: () => void;
};

export function MaterialRow({ material, onOpenPress, onDeletePress }: MaterialRowProps) {
  const meta = [material.fileName, material.fileSizeLabel].filter(Boolean).join(' • ');

  return (
    <Card style={styles.card}>
      <View style={styles.iconCircle}>
        <IconSymbol name={KIND_ICON[material.kind]} size={18} color={Colors.light.primary} />
      </View>

      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Abrir material ${material.title}`}
        onPress={onOpenPress}
        style={styles.text}>
        <View style={styles.badgeRow}>
          <StatusBadge label={material.kindLabel} tone="primary" />
          <UmbrellaText
            variant="caption"
            color={Colors.light.textSecondary}
            numberOfLines={1}
            style={styles.moduleTitle}>
            {material.moduleTitle}
          </UmbrellaText>
        </View>
        <UmbrellaText variant="bodyMedium">{material.title}</UmbrellaText>
        {material.description ? (
          <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={2}>
            {material.description}
          </UmbrellaText>
        ) : null}
        <UmbrellaText variant="caption" color={Colors.light.primary} numberOfLines={1}>
          {meta || displayHost(material.url)}
        </UmbrellaText>
      </Pressable>

      {onDeletePress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Excluir material ${material.title}`}
          onPress={onDeletePress}
          hitSlop={8}
          style={styles.deleteButton}>
          <IconSymbol name="trash.fill" size={18} color={Colors.light.error} />
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  moduleTitle: {
    flexShrink: 1,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
