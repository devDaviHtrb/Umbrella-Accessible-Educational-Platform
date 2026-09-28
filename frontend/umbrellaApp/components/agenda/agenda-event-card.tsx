import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { AgendaEvent } from '@/types/agenda';

export type AgendaEventCardProps = {
  event: AgendaEvent;
  onPress?: () => void;
};

export function AgendaEventCard({ event, onPress }: AgendaEventCardProps) {
  return (
    <Pressable style={styles.row} accessibilityRole="button" onPress={onPress}>
      <UmbrellaText variant="label" color={Colors.light.textSecondary} style={styles.time}>
        {event.time}
      </UmbrellaText>

      <Card
        style={[
          styles.card,
          event.accentColor ? { borderLeftWidth: 3, borderLeftColor: event.accentColor } : undefined,
        ]}>
        <View style={styles.headerRow}>
          <UmbrellaText variant="bodyMedium" style={styles.title}>
            {event.title}
          </UmbrellaText>
          <IconSymbol
            name={event.trailing === 'bell' ? 'bell.fill' : 'ellipsis'}
            size={16}
            color={Colors.light.textSecondary}
          />
        </View>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          {event.subtitle}
        </UmbrellaText>

        {event.participantCount ? (
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: Colors.light.secondaryFixed }]}>
              <UmbrellaText variant="caption" color={Colors.light.primary}>
                U
              </UmbrellaText>
            </View>
            <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: Colors.light.tertiaryLight }]}>
              <UmbrellaText variant="caption" color={Colors.light.tertiary}>
                U
              </UmbrellaText>
            </View>
            <View style={[styles.avatar, styles.avatarOverlap, styles.avatarMore]}>
              <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                +{event.participantCount - 2}
              </UmbrellaText>
            </View>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const AVATAR_SIZE = 24;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  time: {
    width: 44,
    paddingTop: Spacing.md,
  },
  card: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.surface,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarMore: {
    backgroundColor: Colors.light.surfaceContainerLow,
  },
});