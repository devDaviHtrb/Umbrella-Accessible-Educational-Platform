import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ClassResource } from '@/types/class';

export type ClassResourceItemProps = {
  resource: ClassResource;
  onDownload?: () => void;
};

export function ClassResourceItem({ resource, onDownload }: ClassResourceItemProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconCircle}>
        <IconSymbol name={resource.icon} size={18} color={Colors.light.primary} />
      </View>

      <View style={styles.textColumn}>
        <UmbrellaText variant="bodyMedium" numberOfLines={1}>
          {resource.name}
        </UmbrellaText>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          {resource.meta}
        </UmbrellaText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Baixar ${resource.name}`}
        onPress={onDownload}
        hitSlop={8}>
        <IconSymbol name="square.and.arrow.down" size={20} color={Colors.light.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
});