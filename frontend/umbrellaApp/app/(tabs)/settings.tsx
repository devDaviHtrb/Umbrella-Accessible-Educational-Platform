import { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { useUser } from '@/hooks/api/user/useUser';

export default function SettingsScreen() {
  const { user, userName, userEmail, userRoles, logout } = useAuthContext();
  const { profile, loading, saving, updateNeurodivergence } = useUser();

  const [neurodivergenceText, setNeurodivergenceText] = useState('');

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

  return (
    <ScreenContainer header={<AppHeader />}>
      <View>
        <UmbrellaText variant="display">Ajustes</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Gerencie suas preferências e credenciais de acesso.
        </UmbrellaText>
      </View>

      {/* Perfil */}
      <Card style={styles.card}>
        <UmbrellaText variant="title">Perfil do Usuário</UmbrellaText>

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

      {/* Neurodivergência */}
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
            <SecondaryButton
              variant="solid"
              label={saving ? 'Salvando...' : 'Salvar'}
              onPress={handleSaveNeurodivergence}
              disabled={saving}
            />
          </>
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: Spacing.sm,
  },
  card: {
    gap: Spacing.md,
  },
  infoRow: {
    gap: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.outline,
    marginVertical: Spacing.xs,
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
