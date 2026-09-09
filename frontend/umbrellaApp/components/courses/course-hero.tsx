import { StyleSheet, View } from 'react-native';

import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type CourseHeroProps = {
  title: string;
  badgeLabel: string;
};

export function CourseHero({ title, badgeLabel }: CourseHeroProps) {
  return (
    <View style={styles.hero}>
      <StatusBadge label={badgeLabel.toUpperCase()} tone="teal" />
      <UmbrellaText variant="title" color={Colors.light.surface}>
        {title}
      </UmbrellaText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 200,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.primaryStrong,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
});