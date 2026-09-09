import { StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { AgendaEvent } from '@/types/painel';

const DOT_COLUMN_WIDTH = 28;

export type AgendaTimelineProps = {
  events: AgendaEvent[];
};

export function AgendaTimeline({ events }: AgendaTimelineProps) {
  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.verticalLine,
          { left: DOT_COLUMN_WIDTH / 2 - 1 },
        ]}
      />
      {events.map((event, index) => (
        <TimelineEvent key={event.id} event={event} isLast={index === events.length - 1} />
      ))}
    </View>
  );
}

function TimelineEvent({ event, isLast }: { event: AgendaEvent; isLast: boolean }) {
  const isNow = event.state === 'now';
  const isUpcoming = event.state === 'upcoming';

  return (
    <View style={[styles.row, !isLast && styles.rowSpacing]}>
      <View style={styles.dotColumn}>
        {isNow ? (
          <View style={styles.dotNow}>
            <IconSymbol name="play.fill" size={10} color={Colors.light.surface} />
          </View>
        ) : (
          <View
            style={[
              styles.dot,
              isUpcoming ? styles.dotUpcoming : styles.dotPast,
            ]}
          />
        )}
      </View>

      <View style={styles.content}>
        <UmbrellaText
          variant="label"
          color={isNow ? Colors.light.tertiary : Colors.light.textSecondary}
          style={isNow && styles.nowTimeSpacing}>
          {event.time}
        </UmbrellaText>

        <View style={isNow ? styles.nowCard : undefined}>
          <UmbrellaText
            variant="bodyMedium"
            color={isUpcoming ? Colors.light.textSecondary : Colors.light.text}>
            {event.title}
          </UmbrellaText>
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            {event.location}
          </UmbrellaText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  verticalLine: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: Colors.light.outline,
  },
  row: {
    flexDirection: 'row',
  },
  rowSpacing: {
    marginBottom: Spacing.lg,
  },
  dotColumn: {
    width: DOT_COLUMN_WIDTH,
    alignItems: 'center',
    paddingTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotPast: {
    backgroundColor: Colors.light.primary,
  },
  dotUpcoming: {
    backgroundColor: Colors.light.surface,
    borderWidth: 2,
    borderColor: Colors.light.outline,
  },
  dotNow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  nowTimeSpacing: {
    marginBottom: Spacing.xs,
  },
  nowCard: {
    backgroundColor: Colors.light.tertiaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 2,
  },
});
