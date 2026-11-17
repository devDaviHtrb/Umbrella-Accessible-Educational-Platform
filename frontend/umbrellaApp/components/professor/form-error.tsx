import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors } from '@/constants/theme';

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <UmbrellaText variant="caption" color={Colors.light.error} accessibilityRole="alert">
      {message}
    </UmbrellaText>
  );
}
