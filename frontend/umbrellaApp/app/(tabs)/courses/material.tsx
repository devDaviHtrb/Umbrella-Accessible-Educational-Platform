import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import WebViewImport from 'react-native-webview';
import { type ComponentType } from 'react';

import { ScreenContainer } from '@/components/layout/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useModuleMaterials } from '@/hooks/api/storage/useModuleMaterials';
import type { ModuleMaterial } from '@/types/materials';
import { downloadMaterial } from '@/utils/download-material';
import { openMaterialInBrowser } from '@/utils/open-material';

const WebView = WebViewImport as unknown as ComponentType<{
  source: { uri: string };
  style?: unknown;
  originWhitelist?: readonly string[];
  startInLoadingState?: boolean;
}>;

type MaterialParams = {
  title?: string;
  url?: string;
  description?: string;
  resourceType?: string;
  fileType?: string;
  moduleId?: string;
};

type ViewItem = { title: string; url: string; description?: string; resourceType?: string; fileType?: string };

function classify(url: string, resourceType?: string, fileType?: string) {
  const type = (resourceType ?? '').toLowerCase();
  const ext = (fileType ?? '').toLowerCase().replace(/^\./, '') || (url.split('?')[0].split('.').pop() ?? '').toLowerCase();
  if (type === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'odp'].includes(ext)) return 'office';
  if (['txt', 'csv', 'json'].includes(ext)) return 'text';
  return 'other';
}

export default function MaterialViewerScreen() {
  const params = useLocalSearchParams<MaterialParams>();
  const { moduleId } = params;

  // Busca os materiais do módulo (exceto vídeos, que abrem no player) para
  // permitir navegar entre eles com os botões anterior/próximo.
  const { materials } = useModuleMaterials(moduleId ?? '');
  const items = useMemo<ViewItem[]>(() => {
    const list: ViewItem[] = (materials ?? [])
      .filter((m: ModuleMaterial) => (m.resourceType ?? '').toLowerCase() !== 'video' && !!m.url)
      .map((m: ModuleMaterial) => ({
        title: m.title,
        url: m.url,
        description: m.description,
        resourceType: m.resourceType,
        fileType: m.fileType,
      }));
    // Garante que o material aberto esteja na lista (caso ainda não carregou).
    const openedUrl = typeof params.url === 'string' ? params.url : '';
    if (openedUrl && !list.some((i) => i.url === openedUrl)) {
      const opened: ViewItem = {
        title: typeof params.title === 'string' ? params.title : 'Material',
        url: openedUrl,
        description: typeof params.description === 'string' ? params.description : undefined,
        resourceType: typeof params.resourceType === 'string' ? params.resourceType : undefined,
        fileType: typeof params.fileType === 'string' ? params.fileType : undefined,
      };
      list.unshift(opened);
    }
    return list;
  }, [materials, params.url, params.title, params.description, params.resourceType, params.fileType]);

  const [index, setIndex] = useState(0);

  // Posiciona no material que foi aberto quando a lista carrega.
  useEffect(() => {
    if (!params.url) return;
    const found = items.findIndex((i) => i.url === params.url);
    if (found >= 0) setIndex(found);
  }, [items, params.url]);

  const current = items[index] ?? {
    title: params.title ?? 'Material',
    url: params.url ?? '',
    description: params.description,
    resourceType: params.resourceType,
    fileType: params.fileType,
  };

  const kind = classify(current.url, current.resourceType, current.fileType);
  const officeViewer = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(current.url)}`;
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  return (
    <ScreenContainer disableTopInset contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: current.title }} />

      <View style={styles.header}>
        <UmbrellaText variant="title" numberOfLines={2}>
          {current.title}
        </UmbrellaText>
        {items.length > 1 ? (
          <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
            Material {index + 1} de {items.length}
          </UmbrellaText>
        ) : null}
        {current.description ? (
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            {current.description}
          </UmbrellaText>
        ) : null}
      </View>

      <View style={styles.viewer}>
        {kind === 'image' ? (
          <Image source={{ uri: current.url }} style={styles.image} resizeMode="contain" />
        ) : kind === 'pdf' || kind === 'text' ? (
          <WebView source={{ uri: current.url }} style={styles.web} startInLoadingState />
        ) : kind === 'office' ? (
          <WebView source={{ uri: officeViewer }} style={styles.web} startInLoadingState />
        ) : (
          <View style={styles.placeholder}>
            <ActivityIndicator color={Colors.light.primary} />
            <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.placeholderText}>
              Pré-visualização indisponível para este tipo de arquivo. Use os botões abaixo para abrir ou baixar.
            </UmbrellaText>
          </View>
        )}
      </View>

      {/* Navegação anterior / próximo entre os materiais do módulo. */}
      {items.length > 1 ? (
        <View style={styles.navRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Material anterior"
            disabled={!hasPrev}
            onPress={() => hasPrev && setIndex((i) => i - 1)}
            style={[styles.navButton, !hasPrev && styles.navButtonDisabled]}>
            <IconSymbol name="chevron.left" size={20} color={hasPrev ? Colors.light.primary : Colors.light.textSecondary} />
            <UmbrellaText variant="bodyMedium" color={hasPrev ? Colors.light.primary : Colors.light.textSecondary}>
              Anterior
            </UmbrellaText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Próximo material"
            disabled={!hasNext}
            onPress={() => hasNext && setIndex((i) => i + 1)}
            style={[styles.navButton, !hasNext && styles.navButtonDisabled]}>
            <UmbrellaText variant="bodyMedium" color={hasNext ? Colors.light.primary : Colors.light.textSecondary}>
              Próximo
            </UmbrellaText>
            <IconSymbol name="chevron.right" size={20} color={hasNext ? Colors.light.primary : Colors.light.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton
          label="Baixar"
          icon="square.and.arrow.down"
          iconPosition="leading"
          onPress={() => downloadMaterial(current.url, current.title)}
        />
        <SecondaryButton
          label="Abrir no navegador"
          onPress={() => openMaterialInBrowser({ title: current.title, url: current.url, description: current.description })}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
  },
  viewer: {
    height: 400,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  web: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  placeholderText: {
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceContainerLow,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  actions: {
    gap: Spacing.md,
  },
});
