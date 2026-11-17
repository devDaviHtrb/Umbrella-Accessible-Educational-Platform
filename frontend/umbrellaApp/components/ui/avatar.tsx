import { Image, StyleSheet, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius } from '@/constants/theme';

export type AvatarProps = {
  /** URL da foto. Quando ausente, mostra a inicial do nome (ou um ícone). */
  uri?: string | null;
  /** Nome, usado para a inicial do fallback e acessibilidade. */
  name?: string | null;
  size?: number;
  /** Formato: círculo (pessoas) ou arredondado (grupos/cursos). */
  shape?: 'circle' | 'rounded';
  /** Ícone de fallback quando não há nome nem foto. */
  fallbackIcon?: IconSymbolName;
};

function initials(name?: string | null): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Avatar reutilizável: foto (se houver), ou inicial do nome, ou ícone. */
export function Avatar({ uri, name, size = 40, shape = 'circle', fallbackIcon = 'person.fill' }: AvatarProps) {
  const radius = shape === 'circle' ? size / 2 : Radius.md;
  const base = {
    width: size,
    height: size,
    borderRadius: radius,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[base, styles.image]}
        accessibilityLabel={name ? `Foto de ${name}` : 'Foto'}
      />
    );
  }

  const label = initials(name);
  return (
    <View style={[base, styles.fallback]} accessibilityLabel={name ?? 'Avatar'}>
      {label ? (
        <UmbrellaText variant="bodyMedium" color={Colors.light.surface} style={{ fontSize: size * 0.4 }}>
          {label}
        </UmbrellaText>
      ) : (
        <IconSymbol name={fallbackIcon} size={size * 0.5} color={Colors.light.surface} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  fallback: {
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
