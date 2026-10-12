import { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Alert, ActivityIndicator, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { useUser } from '@/hooks/api/user/useUser';

type SettingsTab = 'profile' | 'photo' | 'accessibility';

export default function SettingsScreen() {
  const { user, userName, userEmail, userRoles, logout } = useAuthContext();
  const { profile, loading, saving, uploadingAvatar, updateNeurodivergence, uploadAvatar } = useUser();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [neurodivergenceText, setNeurodivergenceText] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // Populate field once profile is loaded
  useEffect(() => {
    if (profile?.neurodivergence != null) {
      setNeurodivergenceText(profile.neurodivergence);
    }
  }, [profile?.neurodivergence]);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  async function handleSaveNeurodivergence() {
    const success = await updateNeurodivergence(neurodivergenceText);
    if (success) {
      Alert.alert('Salvo!', 'Suas informações foram atualizadas. O Tutor IA já vai considerar isso nas próximas respostas.');
    } else {
      Alert.alert('Erro', 'Não foi possível salvar as informações. Tente novamente.');
    }
  }

  async function handlePickImage() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Permissão necessária',
        'É preciso autorizar o acesso à galeria para selecionar uma foto de perfil.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedAsset(result.assets[0]);
    }
  }

  async function handleTakePhoto() {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Permissão necessária',
        'É preciso autorizar o acesso à câmera para tirar uma nova foto.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedAsset(result.assets[0]);
    }
  }

  async function handleSavePhoto() {
    if (!selectedAsset) {
      Alert.alert('Aviso', 'Selecione ou tire uma foto primeiro.');
      return;
    }

    const uploadedUrl = await uploadAvatar(selectedAsset);
    if (uploadedUrl) {
      setSelectedAsset(null);
      Alert.alert('Sucesso!', 'Sua foto de perfil foi atualizada com sucesso.');
    } else {
      Alert.alert('Erro', 'Não foi possível enviar a foto. Tente novamente.');
    }
  }

  const currentAvatarUrl = selectedAsset?.uri || profile?.avatarUrl;

  return (
    <ScreenContainer header={<AppHeader />}>
      <View>
        <UmbrellaText variant="display">Ajustes</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Gerencie suas preferências, foto e credenciais de acesso.
        </UmbrellaText>
      </View>

      {/* Navegação entre Abas de Configurações */}
      <View style={styles.tabContainer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('profile')}
          style={[styles.tabButton, activeTab === 'profile' && styles.tabButtonActive]}>
          <IconSymbol
            name="person.fill"
            size={16}
            color={activeTab === 'profile' ? Colors.light.primary : Colors.light.textSecondary}
          />
          <UmbrellaText
            variant="bodyMedium"
            color={activeTab === 'profile' ? Colors.light.primary : Colors.light.textSecondary}
            style={activeTab === 'profile' ? styles.tabTextActive : styles.tabText}>
            Perfil
          </UmbrellaText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('photo')}
          style={[styles.tabButton, activeTab === 'photo' && styles.tabButtonActive]}>
          <IconSymbol
            name="camera.fill"
            size={16}
            color={activeTab === 'photo' ? Colors.light.primary : Colors.light.textSecondary}
          />
          <UmbrellaText
            variant="bodyMedium"
            color={activeTab === 'photo' ? Colors.light.primary : Colors.light.textSecondary}
            style={activeTab === 'photo' ? styles.tabTextActive : styles.tabText}>
            Foto
          </UmbrellaText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('accessibility')}
          style={[styles.tabButton, activeTab === 'accessibility' && styles.tabButtonActive]}>
          <IconSymbol
            name="brain.head.profile"
            size={16}
            color={activeTab === 'accessibility' ? Colors.light.primary : Colors.light.textSecondary}
          />
          <UmbrellaText
            variant="bodyMedium"
            color={activeTab === 'accessibility' ? Colors.light.primary : Colors.light.textSecondary}
            style={activeTab === 'accessibility' ? styles.tabTextActive : styles.tabText}>
            Acessibilidade
          </UmbrellaText>
        </Pressable>
      </View>

      {/* ABA: PERFIL */}
      {activeTab === 'profile' && (
        <Card style={styles.card}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarThumbnail}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarThumbnailImg} />
              ) : (
                <IconSymbol name="person.fill" size={32} color={Colors.light.textSecondary} />
              )}
            </View>
            <View style={styles.profileHeaderText}>
              <UmbrellaText variant="title">
                {userName || user?.name || 'Estudante'}
              </UmbrellaText>
              <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
                {userEmail || user?.email || ''}
              </UmbrellaText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <UmbrellaText variant="label" color={Colors.light.textSecondary}>Nome:</UmbrellaText>
            <UmbrellaText variant="bodyMedium">{userName || user?.name || 'Não informado'}</UmbrellaText>
          </View>

          <View style={styles.infoRow}>
            <UmbrellaText variant="label" color={Colors.light.textSecondary}>E-mail:</UmbrellaText>
            <UmbrellaText variant="bodyMedium">{userEmail || user?.email || 'Não informado'}</UmbrellaText>
          </View>

          <View style={styles.infoRow}>
            <UmbrellaText variant="label" color={Colors.light.textSecondary}>Perfil:</UmbrellaText>
            <UmbrellaText variant="bodyMedium">
              {userRoles && userRoles.length > 0 ? userRoles.join(', ') : 'Estudante'}
            </UmbrellaText>
          </View>

          <View style={styles.divider} />

          <SecondaryButton
            variant="outline"
            label="Encerrar Sessão (Sair)"
            onPress={handleLogout}
          />
        </Card>
      )}

      {/* ABA: FOTO DE PERFIL */}
      {activeTab === 'photo' && (
        <Card style={styles.card}>
          <UmbrellaText variant="title">Foto de Perfil</UmbrellaText>
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Escolha uma imagem da sua galeria ou tire uma foto com a câmera para personalizar sua conta na plataforma.
          </UmbrellaText>

          {/* Preview do Avatar */}
          <View style={styles.avatarPreviewContainer}>
            <View style={styles.avatarLargeWrapper}>
              {currentAvatarUrl ? (
                <Image source={{ uri: currentAvatarUrl }} style={styles.avatarLargeImg} />
              ) : (
                <IconSymbol name="person.fill" size={60} color={Colors.light.textSecondary} />
              )}
              {uploadingAvatar && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.light.surface} />
                </View>
              )}
            </View>
            {selectedAsset && (
              <UmbrellaText variant="caption" color={Colors.light.primary} style={styles.pendingNotice}>
                Foto selecionada (clique em Salvar para enviar)
              </UmbrellaText>
            )}
          </View>

          {/* Botões de Ação para Foto */}
          <View style={styles.photoActionsRow}>
            <Pressable
              accessibilityRole="button"
              style={styles.photoPickerBtn}
              onPress={handlePickImage}
              disabled={uploadingAvatar}>
              <IconSymbol name="photo.fill" size={20} color={Colors.light.primary} />
              <UmbrellaText variant="bodyMedium" color={Colors.light.primary}>
                Galeria
              </UmbrellaText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={styles.photoPickerBtn}
              onPress={handleTakePhoto}
              disabled={uploadingAvatar}>
              <IconSymbol name="camera.fill" size={20} color={Colors.light.primary} />
              <UmbrellaText variant="bodyMedium" color={Colors.light.primary}>
                Câmera
              </UmbrellaText>
            </Pressable>
          </View>

          {selectedAsset && (
            <PrimaryButton
              label={uploadingAvatar ? 'Enviando foto...' : 'Salvar Foto de Perfil'}
              onPress={handleSavePhoto}
              disabled={uploadingAvatar}
            />
          )}
        </Card>
      )}

      {/* ABA: ACESSIBILIDADE */}
      {activeTab === 'accessibility' && (
        <Card style={styles.card}>
          <UmbrellaText variant="title">Acessibilidade para o Tutor IA</UmbrellaText>
          <UmbrellaText variant="body" color={Colors.light.textSecondary}>
            Descreva aqui sua neurodivergência ou necessidade de aprendizagem. O Tutor IA usará essa informação para adaptar suas respostas a você.
          </UmbrellaText>

          {loading ? (
            <ActivityIndicator color={Colors.light.primary} />
          ) : (
            <>
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="Ex: Tenho TDAH e processo melhor informações em listas curtas e exemplos práticos..."
                value={neurodivergenceText}
                onChangeText={setNeurodivergenceText}
                style={styles.textArea}
              />
              <PrimaryButton
                label={saving ? 'Salvando...' : 'Salvar Alterações'}
                onPress={handleSaveNeurodivergence}
                disabled={saving}
              />
            </>
          )}
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: Spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceContainerLow,
    borderRadius: Radius.sm,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: 6,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.light.surface,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontWeight: '500',
    fontSize: 13,
  },
  tabTextActive: {
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    gap: Spacing.md,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.light.outline,
  },
  avatarThumbnailImg: {
    width: '100%',
    height: '100%',
  },
  profileHeaderText: {
    flex: 1,
    gap: 2,
  },
  infoRow: {
    gap: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.outline,
    marginVertical: Spacing.xs,
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  avatarLargeWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.light.primary,
  },
  avatarLargeImg: {
    width: '100%',
    height: '100%',
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingNotice: {
    fontWeight: '600',
    textAlign: 'center',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  photoPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.light.outline,
    gap: Spacing.sm,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.light.outline,
    borderRadius: 8,
    padding: Spacing.sm,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    color: Colors.light.text,
  },
});
