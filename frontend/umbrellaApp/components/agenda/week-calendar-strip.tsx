import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { CalendarDay } from '@/types/agenda';

export type WeekCalendarStripProps = {
  monthLabel: string;
  weekLabel: string;
  days: CalendarDay[];
  selectedIndex: number;
  onSelectDay: (index: number) => void;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
};

export function WeekCalendarStrip({
  monthLabel,
  weekLabel,
  days,
  selectedIndex,
  onSelectDay,
  onPrevWeek,
  onNextWeek,
}: WeekCalendarStripProps) {
  return (
    <View>
      <View style={styles.headerRow}>
        <View>
          <UmbrellaText variant="headline" color={Colors.light.primary}>
            {monthLabel}
          </UmbrellaText>
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            {weekLabel}
          </UmbrellaText>
        </View>
        <View style={styles.navButtons}>
          <Pressable accessibilityRole="button" onPress={onPrevWeek} style={styles.navButton}>
            <IconSymbol name="chevron.left" size={16} color={Colors.light.text} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onNextWeek} style={styles.navButton}>
            <IconSymbol name="chevron.right" size={16} color={Colors.light.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.daysRow}>
        {days.map((day, index) => {
          const selected = index === selectedIndex;

          return (
            <Pressable
              key={`${day.weekdayLabel}-${day.dayNumber}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelectDay(index)}
              style={styles.dayColumn}>
              <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                {day.weekdayLabel}
              </UmbrellaText>
              <View style={[styles.dayCircle, selected && styles.dayCircleSelected]}>
                <UmbrellaText
                  variant="bodyMedium"
                  color={selected ? Colors.light.surface : Colors.light.text}>
                  {day.dayNumber}
                </UmbrellaText>
              </View>
              <View
                style={[
                  styles.dot,
                  day.hasEvent ? styles.dotVisible : styles.dotHidden,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  navButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: Colors.light.primary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotVisible: {
    backgroundColor: Colors.light.primary,
  },
  dotHidden: {
    backgroundColor: 'transparent',
  },
});