import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type DropzoneSurfaceProps = {
  title: string;
  caption: string;
  accessibilityLabel: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function DropzoneSurface({
  title,
  caption,
  accessibilityLabel,
  active = false,
  disabled = false,
  onPress,
}: DropzoneSurfaceProps) {
  return (
    <View style={[styles.zone, active && styles.zoneActive, disabled && styles.zoneDisabled]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        disabled={disabled}
        style={styles.zoneBody}>
        <View style={[styles.iconCircle, active && styles.iconCircleActive]}>
          <IconSymbol
            name="square.and.arrow.up"
            size={26}
            color={active ? Colors.light.surface : Colors.light.primary}
          />
        </View>
        <UmbrellaText variant="bodyMedium" style={styles.centered}>
          {title}
        </UmbrellaText>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.centered}>
          {caption}
        </UmbrellaText>
      </Pressable>

      <SecondaryButton
        label="Selecionar arquivos"
        variant="filled"
        onPress={onPress}
        disabled={disabled}
        style={styles.pickButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.light.primaryLight,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surfaceContainerLow,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  zoneActive: {
    borderStyle: 'solid',
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.surface,
  },
  zoneDisabled: {
    opacity: 0.5,
  },
  zoneBody: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  iconCircleActive: {
    backgroundColor: Colors.light.primary,
  },
  centered: {
    textAlign: 'center',
  },
  pickButton: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
  },
});