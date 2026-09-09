import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staySignedIn, setStaySignedIn] = useState(false);

  function handleLogin() {
    router.replace('/(tabs)');
  }

  return (
    <ScreenContainer header={<AppHeader />}>
      <View>
        <UmbrellaText variant="display">
          Bem-vindo à{'\n'}
          <UmbrellaText variant="display" color={Colors.light.primary}>
            Umbrella.
          </UmbrellaText>
        </UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
          Acesse seu santuário digital para o aprendizado. Projetado para o conforto cognitivo,
          estruturado para o seu sucesso acadêmico.
        </UmbrellaText>
      </View>

      <Card style={styles.card}>
        <View>
          <UmbrellaText variant="title">Entrar</UmbrellaText>
          <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.cardSubtitle}>
            Bem-vindo de volta, Estudante. Por favor, insira seus dados.
          </UmbrellaText>
        </View>

        <TextField
          label="Endereço de E-mail"
          icon="envelope.fill"
          placeholder="estudante@umbrella.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextField
          label="Senha"
          icon="lock.fill"
          placeholder="••••••••"
          secureTextEntry
          labelActionText="Esqueceu a senha?"
          value={password}
          onChangeText={setPassword}
        />

        <Checkbox
          checked={staySignedIn}
          onChange={setStaySignedIn}
          label="Mantenha-me conectado"
        />

        <PrimaryButton label="Entrar" icon="arrow.right" onPress={handleLogin} />

        <View style={styles.divider} />

        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.centered}>
          Novo na Umbrella?
        </UmbrellaText>

        <SecondaryButton variant="filled" label="Criar Conta" />
      </Card>

      <View style={styles.footer}>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.centered}>
          Centro de Privacidade · Recursos Acadêmicos · Suporte
        </UmbrellaText>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.centered}>
          Nó de Acesso Seguro · v2.4.0
        </UmbrellaText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: Spacing.md,
  },
  card: {
    gap: Spacing.lg,
  },
  cardSubtitle: {
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.outline,
  },
  centered: {
    textAlign: 'center',
  },
  footer: {
    gap: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
});
