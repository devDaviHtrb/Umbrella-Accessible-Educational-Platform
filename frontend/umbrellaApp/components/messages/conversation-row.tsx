import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ChatKind } from '@/types/messages';

export type ConversationRowProps = {
  kind: ChatKind;
  title: string;
  subtitle: string;
  time?: string;
  onPress: () => void;
};

export function ConversationRow({ kind, title, subtitle, time, onPress }: ConversationRowProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${subtitle}`} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.icon}>
          <IconSymbol
            name={kind === 'course' ? 'person.2.fill' : 'person.fill'}
            size={18}
            color={Colors.light.primary}
          />
        </View>
        <View style={styles.text}>
          <View style={styles.titleRow}>
            <UmbrellaText variant="bodyMedium" numberOfLines={1} style={styles.title}>
              {title}
            </UmbrellaText>
            <StatusBadge label={kind === 'course' ? 'CURSO' : 'PESSOAL'} tone={kind === 'course' ? 'teal' : 'primary'} />
          </View>
          <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={1}>
            {subtitle}
          </UmbrellaText>
        </View>
        {time ? (
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            {time}
          </UmbrellaText>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
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
    gap: Spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flexShrink: 1,
  },
});
