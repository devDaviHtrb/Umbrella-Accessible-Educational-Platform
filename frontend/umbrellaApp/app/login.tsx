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
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { AuthFieldErrors } from '@/hooks/api/auth/useAuth';

export default function LoginScreen() {
  const { login } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});

  function validate() {
    const newErrors: AuthFieldErrors = {};
    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Insira um e-mail válido.';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await login({ email: email.trim(), password });
      console.log('Logado com sucesso! Token:', response.accessToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error && error.fieldErrors) {
        setErrors(error.fieldErrors);
      } else {
        setErrors({
          general: error.message || 'E-mail ou senha incorretos.',
        });
      }
    } finally {
      setIsLoading(false);
    }
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
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email || errors.general) {
              setErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
            }
          }}
          editable={!isLoading}
          error={errors.email}
        />

        <TextField
          label="Senha"
          icon="lock.fill"
          placeholder="••••••••"
          secureTextEntry
          labelActionText="Esqueceu a senha?"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password || errors.general) {
              setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
            }
          }}
          editable={!isLoading}
          error={errors.password}
        />

        {errors.general ? (
          <UmbrellaText variant="caption" color={Colors.light.error} style={styles.generalError}>
            {errors.general}
          </UmbrellaText>
        ) : null}

        <Checkbox
          checked={staySignedIn}
          onChange={setStaySignedIn}
          label="Mantenha-me conectado"
        />

        <PrimaryButton
          label={isLoading ? "Entrando..." : "Entrar"}
          icon="arrow.right"
          onPress={handleLogin}
          disabled={isLoading}
        />

        <View style={styles.divider} />

        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.centered}>
          Novo na Umbrella?
        </UmbrellaText>

        <SecondaryButton
          variant="filled"
          label="Criar Conta"
          onPress={() => router.push('/signUp')}
        />
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
  generalError: {
    marginTop: -Spacing.xs,
    fontSize: 12,
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
