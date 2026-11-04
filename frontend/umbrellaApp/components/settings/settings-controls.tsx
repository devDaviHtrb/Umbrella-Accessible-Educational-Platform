import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/preferences/preferencesContext';

export function SettingsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconSymbolName;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <IconSymbol name={icon} size={20} color={Colors.light.primary} />
        <UmbrellaText variant="title">{title}</UmbrellaText>
      </View>
      {children}
    </Card>
  );
}

export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { translate } = usePreferences();

  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <UmbrellaText variant="bodyMedium">{label}</UmbrellaText>
        {description ? (
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            {description}
          </UmbrellaText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: translate(Colors.light.outline),
          true: translate(Colors.light.primary),
        }}
        thumbColor={translate(Colors.light.surface)}
      />
    </View>
  );
}

export function OptionPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { translate } = usePreferences();

  return (
    <View style={styles.pillsBlock}>
      <UmbrellaText variant="bodyMedium">{label}</UmbrellaText>
      <View style={styles.pills} accessibilityRole="radiogroup">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(option.id)}
              style={[
                styles.pill,
                {
                  backgroundColor: translate(
                    selected ? Colors.light.primary : Colors.light.surfaceContainerLow,
                  ),
                },
              ]}>
              <UmbrellaText
                variant="caption"
                color={selected ? Colors.light.surface : Colors.light.textSecondary}>
                {option.label}
              </UmbrellaText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <UmbrellaText variant="label" color={Colors.light.textSecondary}>
        {label}
      </UmbrellaText>
      <UmbrellaText variant="bodyMedium" style={styles.infoValue}>
        {value}
      </UmbrellaText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  toggleText: {
    flex: 1,
    gap: 2,
  },
  pillsBlock: {
    gap: Spacing.sm,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
  },
  infoRow: {
    gap: 2,
  },
  infoValue: {
    flexShrink: 1,
  },
});
