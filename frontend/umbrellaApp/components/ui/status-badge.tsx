import { StyleSheet, View } from 'react-native';

import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';

export type StatusBadgeTone = 'teal' | 'neutral' | 'primary' | 'error';

export type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
};

const toneStyles: Record<StatusBadgeTone, { bg: string; fg: string }> = {
  teal: { bg: Colors.light.tertiaryLight, fg: Colors.light.tertiary },
  neutral: { bg: Colors.light.surfaceContainerLow, fg: Colors.light.textSecondary },
  primary: { bg: Colors.light.secondaryFixed, fg: Colors.light.primary },
  error: { bg: `${Colors.light.error}1F`, fg: Colors.light.error },
};

export function StatusBadge({ label, tone = 'teal' }: StatusBadgeProps) {
  const { translate } = usePreferences();
  const colors = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor: translate(colors.bg) }]}>
      <UmbrellaText variant="label" color={colors.fg}>
        {label}
      </UmbrellaText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
});
