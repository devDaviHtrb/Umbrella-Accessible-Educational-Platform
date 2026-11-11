import { ImageBackground, StyleSheet, View } from 'react-native';

import { StatusBadge } from '@/components/ui/status-badge';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';

export type CourseHeroProps = {
  title: string;
  badgeLabel: string;
  imageUrl?: string;
};

export function CourseHero({ title, badgeLabel, imageUrl }: CourseHeroProps) {
  const content = (
    <>
      <StatusBadge label={badgeLabel.toUpperCase()} tone="teal" />
      <UmbrellaText variant="title" color={Colors.light.surface}>
        {title}
      </UmbrellaText>
    </>
  );

  if (imageUrl) {
    return (
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.hero}
        imageStyle={styles.heroImage}>
        <View style={styles.overlay} />
        <View style={styles.heroContent}>{content}</View>
      </ImageBackground>
    );
  }

  return <View style={[styles.hero, styles.heroFallback]}>{content}</View>;
}

const styles = StyleSheet.create({
  hero: {
    height: 200,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  heroFallback: {
    backgroundColor: Colors.light.primaryStrong,
  },
  heroImage: {
    borderRadius: Radius.lg,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 30, 77, 0.45)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
});
