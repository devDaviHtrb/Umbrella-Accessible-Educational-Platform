import { Alert, Linking } from 'react-native';

type OpenableMaterial = {
  title: string;
  url?: string;
  description?: string;
};

export async function openMaterial(material: OpenableMaterial) {
  if (!material.url) {
    Alert.alert(material.title, material.description || 'Material disponível para acompanhamento do módulo.');
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
