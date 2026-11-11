import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type ShortcutRowProps = {
  href: Href;
  icon: IconSymbolName;
  title: string;
  subtitle: string;
};

export function ShortcutRow({ href, icon, title, subtitle }: ShortcutRowProps) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button">
        <Card style={styles.row}>
          <View style={styles.icon}>
            <IconSymbol name={icon} size={18} color={Colors.light.primary} />
          </View>
          <View style={styles.text}>
            <UmbrellaText variant="bodyMedium">{title}</UmbrellaText>
            <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
              {subtitle}
            </UmbrellaText>
          </View>
          <IconSymbol name="chevron.right" size={18} color={Colors.light.textSecondary} />
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
});
