import { Alert, Linking } from 'react-native';
import { router } from 'expo-router';

type OpenableMaterial = {
  title: string;
  url?: string;
  description?: string;
  /** Tipo do recurso ('video', 'image', 'raw'...). Quando 'video', abre o player. */
  resourceType?: string;
  /** Extensão do arquivo (pdf, docx...), ajuda o visualizador a classificar. */
  fileType?: string;
  /** Id da entidade Video, necessário para o player buscar as legendas. */
  videoId?: string | number | null;
  moduleTitle?: string;
  sizeLabel?: string;
  category?: string;
  /** Módulo do material, para o visualizador navegar entre materiais. */
  moduleId?: string | number | null;
};

function isVideo(material: OpenableMaterial): boolean {
  const type = (material.resourceType ?? '').toLowerCase();
  if (type === 'video') return true;
  // Heurística de fallback: URL de vídeo do Cloudinary ou extensão .mp4.
  const url = material.url ?? '';
  return /\/video\/upload\//.test(url) || /\.mp4(\?|$)/i.test(url);
}

/**
 * Abre um material DENTRO do app conforme o tipo:
 *  - VÍDEO  -> Libras Lesson Player (vídeo + legenda + avatar VLibras);
 *  - OUTROS -> visualizador de material (imagem/PDF/office inline + baixar).
 *
 * Centralizar aqui garante que QUALQUER caminho (detalhe do curso, materiais do
 * módulo, aulas gravadas) use a experiência in-app, sem abrir link externo.
 */
export async function openMaterial(material: OpenableMaterial) {
  if (isVideo(material) && material.url) {
    router.push({
      pathname: '/courses/lesson',
      params: {
        title: material.title,
        description: material.description ?? '',
        url: material.url,
        ...(material.category ? { category: material.category } : {}),
        ...(material.moduleTitle ? { moduleTitle: material.moduleTitle } : {}),
        ...(material.sizeLabel ? { sizeLabel: material.sizeLabel } : {}),
        ...(material.videoId != null ? { videoId: String(material.videoId) } : {}),
      },
    });
    return;
  }

  if (!material.url) {
    Alert.alert(material.title, material.description || 'Material disponível para acompanhamento do módulo.');
    return;
  }

  // Demais materiais: abre o visualizador in-app (com pré-visualização + baixar).
  // Passa o moduleId para o visualizador permitir navegar entre os materiais.
  router.push({
    pathname: '/courses/material',
    params: {
      title: material.title,
      url: material.url,
      description: material.description ?? '',
      ...(material.resourceType ? { resourceType: material.resourceType } : {}),
      ...(material.fileType ? { fileType: material.fileType } : {}),
      ...(material.moduleId != null ? { moduleId: String(material.moduleId) } : {}),
    },
  });
}

/** Abre o material direto no navegador do aparelho (usado pelo botão "Abrir"). */
export async function openMaterialInBrowser(material: OpenableMaterial) {
  if (!material.url) {
    Alert.alert(material.title, material.description || 'Material sem URL.');
    return;
  }
  try {
    const canOpen = await Linking.canOpenURL(material.url);
    if (canOpen) {
      await Linking.openURL(material.url);
    } else {
      Alert.alert('Material', `Arquivo: ${material.title}\nURL: ${material.url}`);
    }
  } catch {
    Alert.alert('Erro', 'Não foi possível abrir o link do material.');
  }
}
