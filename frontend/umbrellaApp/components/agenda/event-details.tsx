import { StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import type { AgendaEvent } from '@/types/agenda';

export type EventDetailsProps = {
  event: AgendaEvent;
};

export function EventDetails({ event }: EventDetailsProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <IconSymbol name="clock.fill" size={18} color={Colors.light.primary} />
        <UmbrellaText variant="bodyMedium">{event.time}</UmbrellaText>
      </View>

      <View>
        <UmbrellaText variant="title">{event.title}</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          {event.subtitle}
        </UmbrellaText>
      </View>

      {event.participantCount ? (
        <View style={styles.row}>
          <IconSymbol name="person.2.fill" size={18} color={Colors.light.textSecondary} />
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            {event.participantCount} participantes
          </UmbrellaText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
});