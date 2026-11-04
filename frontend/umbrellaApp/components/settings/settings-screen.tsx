import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import {
  InfoRow,
  OptionPills,
  SettingsSection,
  ToggleRow,
} from '@/components/settings/settings-controls';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { COLOR_BLIND_OPTIONS, FONT_SIZE_OPTIONS } from '@/constants/preferences';
import { loginHref } from '@/constants/routes';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { useUser } from '@/hooks/api/user/useUser';
import { usePreferences } from '@/hooks/preferences/preferencesContext';
import { getJwtExpiry } from '@/utils/jwt';
import { startReading } from '@/utils/speech';

const HELP_ITEMS = [
  {
    title: 'Como usar o leitor de texto',
    body: 'Ative o Leitor de Texto em Preferências visuais e acessibilidade. Um botão Ouvir aparece nas telas: toque nele para ouvir o conteúdo e toque de novo para parar.',
  },
  {
    title: 'Como o Tutor IA usa a neurodivergência',
    body: 'A neurodivergência informada em Acessibilidade é enviada ao Tutor IA para adaptar as respostas às suas necessidades.',
  },
  {
    title: 'Sessão expirada ou problemas de acesso',
    body: 'Se a sessão expirar, basta entrar novamente. As preferências visuais ficam salvas somente neste dispositivo.',
  },
];

function roleLabel(roles: string[]): string {
  if (roles.includes('ROLE_ADMIN')) return 'Administrador';
  if (roles.includes('ROLE_TEACHER')) return 'Professor';
  return 'Aluno';
}

function formatExpiry(token: string | null): string {
  const expiry = getJwtExpiry(token);
  if (!expiry) return 'Indisponível';
  return new Date(expiry).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function SettingsScreen({ footer }: { footer?: React.ReactNode }) {
  const { user, userName, userEmail, userRoles, userToken, logout } = useAuthContext();
  const { profile, saving, uploadingAvatar, updateNeurodivergence, uploadAvatar } = useUser();
  const { preferences, updatePreferences, resetPreferences } = usePreferences();

  const [neurodivergenceText, setNeurodivergenceText] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [openHelp, setOpenHelp] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.neurodivergence != null) setNeurodivergenceText(profile.neurodivergence);
  }, [profile?.neurodivergence]);

  async function handleLogout() {
    await logout();
    router.replace(loginHref);
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
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'É preciso autorizar o acesso à galeria para selecionar uma foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) setSelectedAsset(result.assets[0]);
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'É preciso autorizar o acesso à câmera para tirar uma nova foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });

    if (!result.canceled && result.assets && result.assets.length > 0) setSelectedAsset(result.assets[0]);
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

  function handleTestReader() {
    startReading(['Leitor de texto ativado. Use o botão Ouvir nas telas para ouvir o conteúdo.'], () => {});
  }

  const currentAvatarUrl = selectedAsset?.uri || profile?.avatarUrl;
  const displayName = userName || user?.name || 'Usuário';

  return (
    <ScreenContainer header={<AppHeader />} footer={footer} keyboardShouldPersistTaps="handled">
      <View>
        <UmbrellaText variant="display">Ajustes</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Gerencie seu perfil, preferências visuais e segurança.
        </UmbrellaText>
      </View>

      <SettingsSection title="Perfil" icon="person.fill">
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            {currentAvatarUrl ? (
              <Image source={{ uri: currentAvatarUrl }} style={styles.avatarImage} />
            ) : (
              <IconSymbol name="person.fill" size={32} color={Colors.light.textSecondary} />
            )}
          </View>
          <View style={styles.profileText}>
            <UmbrellaText variant="title">{displayName}</UmbrellaText>
            <UmbrellaText variant="caption" color={Colors.light.textSecondary}>
              {userEmail || user?.email || ''}
            </UmbrellaText>
            <View style={styles.badge}>
              <StatusBadge label={roleLabel(userRoles)} tone="primary" />
            </View>
          </View>
        </View>

        <View style={styles.photoActions}>
          <View style={styles.photoButton}>
            <SecondaryButton label="Galeria" variant="filled" onPress={handlePickImage} disabled={uploadingAvatar} />
          </View>
          <View style={styles.photoButton}>
            <SecondaryButton label="Câmera" variant="filled" onPress={handleTakePhoto} disabled={uploadingAvatar} />
          </View>
        </View>

        {selectedAsset ? (
          <PrimaryButton
            label={uploadingAvatar ? 'Enviando...' : 'Salvar foto de perfil'}
            onPress={handleSavePhoto}
            disabled={uploadingAvatar}
          />
        ) : null}
      </SettingsSection>

      <SettingsSection title="Preferências visuais e acessibilidade" icon="paintpalette.fill">
        <OptionPills
          label="Daltonismo"
          options={COLOR_BLIND_OPTIONS}
          value={preferences.colorBlindMode}
          onChange={(colorBlindMode) => updatePreferences({ colorBlindMode })}
        />
        <ToggleRow
          label="Alto contraste"
          description="Aumenta o contraste de textos, bordas e botões."
          value={preferences.highContrast}
          onValueChange={(highContrast) => updatePreferences({ highContrast })}
        />
        <OptionPills
          label="Tamanho da fonte"
          options={FONT_SIZE_OPTIONS}
          value={preferences.fontSize}
          onChange={(fontSize) => updatePreferences({ fontSize })}
        />
        <ToggleRow
          label="Leitor de texto"
          description="Mostra um botão Ouvir nas telas para ler o conteúdo em voz alta."
          value={preferences.textToSpeech}
          onValueChange={(textToSpeech) => updatePreferences({ textToSpeech })}
        />
        {preferences.textToSpeech ? (
          <SecondaryButton label="Testar leitor de texto" variant="filled" onPress={handleTestReader} />
        ) : null}
        <ToggleRow
          label="Modo foco"
          description="Reduz elementos decorativos e secundários para ajudar na concentração."
          value={preferences.focusMode}
          onValueChange={(focusMode) => updatePreferences({ focusMode })}
        />

        <View style={styles.divider} />

        <TextField
          label="Neurodivergência (Tutor IA)"
          placeholder="Ex.: TDAH, TEA, Dislexia"
          value={neurodivergenceText}
          onChangeText={setNeurodivergenceText}
          editable={!saving}
        />
        <PrimaryButton
          label={saving ? 'Salvando...' : 'Salvar neurodivergência'}
          onPress={handleSaveNeurodivergence}
          disabled={saving}
        />

        <SecondaryButton label="Restaurar preferências padrão" variant="filled" onPress={resetPreferences} />
      </SettingsSection>

      <SettingsSection title="Notificações" icon="bell.fill">
        <ToggleRow
          label="Receber notificações"
          description="Preferência salva neste dispositivo."
          value={preferences.notifications}
          onValueChange={(notifications) => updatePreferences({ notifications })}
        />
      </SettingsSection>

      <SettingsSection title="Segurança" icon="lock.shield.fill">
        <InfoRow label="E-mail da conta" value={userEmail || user?.email || 'Indisponível'} />
        <InfoRow label="Sessão válida até" value={formatExpiry(userToken)} />
        <InfoRow label="Alterar senha" value="Indisponível: o servidor ainda não oferece a troca de senha." />
      </SettingsSection>

      <SettingsSection title="Suporte e Ajuda" icon="questionmark.circle.fill">
        {HELP_ITEMS.map((item, index) => {
          const open = openHelp === index;
          return (
            <View key={item.title} style={styles.helpItem}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                onPress={() => setOpenHelp(open ? null : index)}
                style={styles.helpHeader}>
                <UmbrellaText variant="bodyMedium" style={styles.helpTitle}>
                  {item.title}
                </UmbrellaText>
                <IconSymbol name={open ? 'chevron.up' : 'chevron.down'} size={18} color={Colors.light.primary} />
              </Pressable>
              {open ? (
                <UmbrellaText variant="body" color={Colors.light.textSecondary}>
                  {item.body}
                </UmbrellaText>
              ) : null}
            </View>
          );
        })}
      </SettingsSection>

      <SecondaryButton label="Sair da Conta" onPress={handleLogout} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: Spacing.xs,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  badge: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  photoActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoButton: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.outline,
  },
  helpItem: {
    gap: Spacing.sm,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  helpTitle: {
    flex: 1,
  },
});
