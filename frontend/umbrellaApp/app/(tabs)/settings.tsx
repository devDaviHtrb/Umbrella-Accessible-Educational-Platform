import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/hooks/api/auth/authContext';

export default function SettingsScreen() {
  const { user, userName, userEmail, userRoles, logout } = useAuthContext();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <ScreenContainer header={<AppHeader />}>
      <View>
        <UmbrellaText variant="display">Ajustes</UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Gerencie suas preferências e credenciais de acesso.
        </UmbrellaText>
      </View>

      <Card style={styles.profileCard}>
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: Spacing.sm,
  },
  profileCard: {
    gap: Spacing.lg,
  },
  infoRow: {
    gap: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.outline,
    marginVertical: Spacing.xs,
  },
});

