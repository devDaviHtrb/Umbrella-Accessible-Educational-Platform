import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { NotificationItem } from '@/hooks/api/notifications/useNotifications';

const ICON: Record<string, IconSymbolName> = {
  MESSAGE: 'bubble.left.and.bubble.right',
  MATERIAL: 'doc.fill',
  VIDEO: 'play.circle.fill',
  ACTIVITY: 'pencil.and.outline',
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

export function NotificationCard({
  notification,
  onPress,
}: {
  notification: NotificationItem;
  onPress: () => void;
}) {
  const icon = ICON[notification.type] ?? 'bell.fill';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.body ?? ''}`}
      onPress={onPress}
      style={[styles.row, !notification.read && styles.unread]}>
      <View style={styles.icon}>
        <IconSymbol name={icon} size={18} color={Colors.light.primary} />
      </View>
      <View style={styles.text}>
        <UmbrellaText variant="bodyMedium" numberOfLines={1}>
          {notification.title}
        </UmbrellaText>
        {notification.body ? (
          <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={2}>
            {notification.body}
          </UmbrellaText>
        ) : null}
      </View>
      <View style={styles.meta}>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
          {timeAgo(notification.createdAt)}
        </UmbrellaText>
        {!notification.read ? <View style={styles.dot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  unread: {
    backgroundColor: Colors.light.secondaryFixed,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  meta: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
});
