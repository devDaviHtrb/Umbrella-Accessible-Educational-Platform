import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type CourseHeroProps = {
  title: string;
  badgeLabel: string;
  imageUrl?: string;
};

export function CourseHero({ title, badgeLabel, imageUrl }: CourseHeroProps) {
  return (
    <View style={styles.hero}>
      {imageUrl ? (
        <>
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            accessibilityLabel={`Capa do curso ${title}`}
          />
          <View style={styles.overlay} />
        </>
      ) : null}

      <View style={styles.content}>
        <StatusBadge label={badgeLabel.toUpperCase()} tone="teal" />
        <UmbrellaText variant="title" color={Colors.light.surface}>
          {title}
        </UmbrellaText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 200,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.primaryStrong,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13, 47, 122, 0.55)',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
});
