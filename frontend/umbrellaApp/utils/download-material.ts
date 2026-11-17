import { Alert, Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

function fileNameFromUrl(url: string, title: string): string {
  const fromUrl = url.split('?')[0].split('/').pop();
  if (fromUrl && /\.[a-z0-9]{2,5}$/i.test(fromUrl)) return fromUrl;
  // Sem extensão clara: usa o título higienizado.
  const safe = title.replace(/[^\w.-]+/g, '_').slice(0, 60) || 'material';
  return safe;
}

/**
 * Baixa o material para o armazenamento do app e abre a folha de
 * compartilhar/salvar do sistema (permite salvar em Arquivos, enviar, etc.).
 * Na web, baixar programaticamente é restrito, então abre numa nova aba.
 */
export async function downloadMaterial(url: string, title: string): Promise<void> {
  if (!url) {
    Alert.alert('Download', 'Material sem URL disponível.');
    return;
  }

  if (Platform.OS === 'web') {
    // Web: deixa o navegador cuidar do download/abertura.
    await WebBrowser.openBrowserAsync(url);
    return;
  }

  try {
    const name = fileNameFromUrl(url, title);
    const dest = new Directory(Paths.cache, 'materials');
    try {
      dest.create({ intermediates: true });
    } catch {
      // Já existe: ok.
    }
    const file = await File.downloadFileAsync(url, new File(dest, name));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri);
    } else {
      Alert.alert('Baixado', `Arquivo salvo em:\n${file.uri}`);
    }
  } catch (e: any) {
    Alert.alert('Erro ao baixar', e?.message ?? 'Não foi possível baixar o material.');
  }
}
