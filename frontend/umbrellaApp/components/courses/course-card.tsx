import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Course } from '@/types/courses';

export type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.id}`} asChild>
      <Pressable accessibilityRole="button">
        <Card padded={false}>
          <View style={[styles.image, { backgroundColor: course.imageTone }]}>
            <View style={styles.badge}>
              <UmbrellaText variant="caption" color={Colors.light.surface} style={styles.badgeText}>
                {course.imageBadge}
              </UmbrellaText>
            </View>
            {course.showTrendingIcon ? (
              <View style={styles.cornerIcon}>
                <IconSymbol name="chart.line.uptrend.xyaxis" size={16} color={Colors.light.primary} />
              </View>
            ) : null}
          </View>

          <View style={styles.content}>
            <UmbrellaText variant="label" color={Colors.light.primary}>
              {course.eyebrow}
            </UmbrellaText>
            <UmbrellaText variant="headline" style={styles.title}>
              {course.title}
            </UmbrellaText>
            <UmbrellaText
              variant="body"
              color={Colors.light.textSecondary}
              numberOfLines={2}
              style={styles.description}>
              {course.description}
            </UmbrellaText>

            <CourseCardFooter footer={course.footer} />
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

function CourseCardFooter({ footer }: { footer: Course['footer'] }) {
  if (footer.type === 'rating') {
    return (
      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <IconSymbol name="clock.fill" size={14} color={Colors.light.textSecondary} />
          <UmbrellaText variant="label" color={Colors.light.textSecondary}>
            {footer.durationLabel}
          </UmbrellaText>
        </View>
        <View style={styles.footerItem}>
          <IconSymbol name="star.fill" size={14} color={Colors.light.textSecondary} />
          <UmbrellaText variant="label" color={Colors.light.textSecondary}>
            {footer.rating.toFixed(1)}
          </UmbrellaText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.footerRowPrice}>
      <UmbrellaText
        variant="bodyMedium"
        color={footer.free ? Colors.light.primary : Colors.light.text}>
        {footer.priceLabel}
      </UmbrellaText>
      <IconSymbol name="arrow.right" size={16} color={Colors.light.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: 160,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    justifyContent: 'flex-start',
  },
  badge: {
    alignSelf: 'flex-start',
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(17, 24, 28, 0.55)',
  },
  badgeText: {
    letterSpacing: 0.4,
  },
  cornerIcon: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerRowPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
