import { Pressable, StyleSheet, View, Linking, Alert } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { ModuleMaterial } from '@/types/materials';

export type ModuleMaterialGridProps = {
  materials: ModuleMaterial[];
  onMaterialPress?: (material: ModuleMaterial) => void;
};

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getMaterialIconAndLabel(material: ModuleMaterial): { icon: IconSymbolName; label: string; toneColor: string } {
  const resourceType = (material.resourceType || '').toLowerCase();
  const fileType = (material.fileType || '').toLowerCase().replace(/^\./, '');

  if (resourceType === 'video') {
    return {
      icon: 'play.circle.fill',
      label: fileType ? fileType.toUpperCase() : 'VÍDEO',
      toneColor: '#D32F2F',
    };
  }

  if (resourceType === 'image') {
    return {
      icon: 'photo.fill',
      label: fileType ? fileType.toUpperCase() : 'IMAGEM',
      toneColor: '#0288D1',
    };
  }

  if (fileType === 'pdf') {
    return {
      icon: 'doc.fill',
      label: 'PDF',
      toneColor: '#E53935',
    };
  }

  if (fileType === 'doc' || fileType === 'docx') {
    return {
      icon: 'doc.richtext.fill',
      label: 'DOC',
      toneColor: '#1976D2',
    };
  }

  if (fileType === 'xls' || fileType === 'xlsx' || fileType === 'csv') {
    return {
      icon: 'doc.fill',
      label: fileType.toUpperCase(),
      toneColor: '#388E3C',
    };
  }

  return {
    icon: 'doc.fill',
    label: fileType ? fileType.toUpperCase() : 'ARQUIVO',
    toneColor: Colors.light.primary,
  };
}

export function ModuleMaterialGrid({ materials, onMaterialPress }: ModuleMaterialGridProps) {
  const handlePress = async (material: ModuleMaterial) => {
    if (onMaterialPress) {
      onMaterialPress(material);
      return;
    }

    if (material.url) {
      try {
        const supported = await Linking.canOpenURL(material.url);
        if (supported) {
          await Linking.openURL(material.url);
        } else {
          Alert.alert('Aviso', 'Não foi possível abrir o link do material.');
        }
      } catch {
        Alert.alert('Erro', 'Ocorreu um erro ao tentar abrir o arquivo.');
      }
    } else {
      Alert.alert('Informação', `Material: ${material.title}\n${material.description || 'Sem descrição adicional.'}`);
    }
  };

  if (!materials || materials.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="folder.fill" size={32} color={Colors.light.textSecondary} />
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.emptyText}>
          Nenhum material complementar cadastrado para este módulo.
        </UmbrellaText>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {materials.map((item) => {
        const { icon, label, toneColor } = getMaterialIconAndLabel(item);
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, formato ${label}, tamanho ${formatFileSize(item.size)}`}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => handlePress(item)}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${toneColor}15` }]}>
                <IconSymbol name={icon} size={22} color={toneColor} />
              </View>
              <View style={[styles.badge, { backgroundColor: `${toneColor}20` }]}>
                <UmbrellaText variant="caption" style={[styles.badgeText, { color: toneColor }]}>
                  {label}
                </UmbrellaText>
              </View>
            </View>

            <View style={styles.cardBody}>
              <UmbrellaText variant="bodyMedium" numberOfLines={2} style={styles.title}>
                {item.title}
              </UmbrellaText>
              {item.description ? (
                <UmbrellaText variant="caption" color={Colors.light.textSecondary} numberOfLines={2} style={styles.description}>
                  {item.description}
                </UmbrellaText>
              ) : null}
            </View>

            <View style={styles.cardFooter}>
              <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                {formatFileSize(item.size)}
              </UmbrellaText>
              <View style={styles.downloadIcon}>
                <IconSymbol name="square.and.arrow.down" size={14} color={Colors.light.primary} />
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  card: {
    width: '48.5%',
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: Spacing.md,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.light.outline,
    minHeight: 140,
  },
  cardPressed: {
    opacity: 0.8,
    backgroundColor: Colors.light.secondaryFixed,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardBody: {
    flex: 1,
    marginBottom: Spacing.sm,
  },
  title: {
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.light.outline,
  },
  downloadIcon: {
    padding: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.md,
    gap: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
  },
});
