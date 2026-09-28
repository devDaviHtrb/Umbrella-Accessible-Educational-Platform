import { StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type AccessibilityAudioCardProps = {
  onPress?: () => void;
};

export function AccessibilityAudioCard({ onPress }: AccessibilityAudioCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <IconSymbol name="person.2.wave.2.fill" size={20} color={Colors.light.primary} />
      </View>

      <UmbrellaText variant="headline" color={Colors.light.primary} style={styles.title}>
        Apoio de Áudio Acessível
      </UmbrellaText>
      <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.description}>
        Dificuldade para ler ou enxergar? Use o áudio privado para interagir com o professor.
      </UmbrellaText>

      <PrimaryButton
        label="Áudio Privado com Professor"
        icon="mic.fill"
        iconPosition="leading"
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.secondaryFixed,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.lg,
  },
});