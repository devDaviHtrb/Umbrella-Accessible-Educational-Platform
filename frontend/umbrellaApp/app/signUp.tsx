import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { homeHrefForRoles } from '@/constants/routes';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthContext } from '@/hooks/api/auth/authContext';
import { useUmbrellaApi } from '@/hooks/api/core/useUmbrellaApi';
import { buildRegisterPayload, validateSignUp, type SignUpErrors } from '@/utils/signup-validation';

type SignUpFormErrors = SignUpErrors & { general?: string };

export default function SignUpScreen() {
  const { register } = useAuthContext();
  const { patch } = useUmbrellaApi();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasNeurodivergence, setHasNeurodivergence] = useState(false);
  const [neurodivergence, setNeurodivergence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<SignUpFormErrors>({});

  function clearError(field: keyof SignUpFormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  }

  async function saveNeurodivergence(text: string) {
    try {
      await patch('public/users/me/neurodivergence', text, { 'Content-Type': 'text/plain' });
      return true;
    } catch {
      return false;
    }
  }

  async function handleSignUp() {
    const form = { name, email, password, hasNeurodivergence, neurodivergence };
    const validation = validateSignUp(form);
    setErrors(validation);

    if (Object.keys(validation).length > 0) return;

    setIsLoading(true);

    try {
      const payload = buildRegisterPayload(form);
      const response = await register(payload);
      const neurodivergenceSaved = payload.neurodivergence ? await saveNeurodivergence(payload.neurodivergence) : true;
      const destination = homeHrefForRoles(response.roles);

      if (neurodivergenceSaved) {
        router.replace(destination);
      } else {
        Alert.alert(
          'Conta criada',
          'Sua conta foi criada, mas não foi possível salvar a neurodivergência. Você pode informá-la depois em Ajustes.',
          [{ text: 'Continuar', onPress: () => router.replace(destination) }],
        );
      }
    } catch (error: any) {
      if (error && error.fieldErrors) {
        setErrors(error.fieldErrors);
      } else {
        setErrors({ general: error?.message || 'Não foi possível criar sua conta. Tente novamente.' });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScreenContainer header={<AppHeader centered />} keyboardShouldPersistTaps="handled">
      <View style={styles.headerContainer}>
        <UmbrellaText variant="display" style={styles.centeredText}>
          Crie sua{' '}
          <UmbrellaText variant="display" color={Colors.light.primary}>
            Jornada.
          </UmbrellaText>
        </UmbrellaText>
        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={[styles.subtitle, styles.centeredText]}>
          Inicie sua imersão no ecossistema Umbrella. Um ambiente unificado para gerenciar seus módulos de
          aprendizado e progresso.
        </UmbrellaText>
      </View>

      <Card style={styles.card}>
        <View>
          <UmbrellaText variant="title">Criar Conta</UmbrellaText>
          <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.cardSubtitle}>
            Cadastre as credenciais do seu acesso estudantil.
          </UmbrellaText>
        </View>

        <TextField
          label="Nome Completo"
          icon="person.fill"
          placeholder="Seu Nome Completo"
          autoCapitalize="words"
          value={name}
          onChangeText={(text) => {
            setName(text);
            clearError('name');
          }}
          editable={!isLoading}
          error={errors.name}
        />

        <TextField
          label="Endereço de E-mail"
          icon="envelope.fill"
          placeholder="estudante@umbrella.edu"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearError('email');
          }}
          editable={!isLoading}
          error={errors.email}
        />

        <TextField
          label="Senha"
          icon="lock.fill"
          placeholder="Mínimo 6 caracteres"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          labelActionText={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          onLabelActionPress={() => setShowPassword((current) => !current)}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearError('password');
          }}
          editable={!isLoading}
          error={errors.password}
        />

        <Checkbox
          checked={hasNeurodivergence}
          onChange={(checked) => {
            setHasNeurodivergence(checked);
            clearError('neurodivergence');
          }}
          label="Possuo alguma neurodivergência"
        />

        {hasNeurodivergence ? (
          <TextField
            label="Neurodivergência"
            placeholder="Ex.: TDAH, TEA, Dislexia"
            value={neurodivergence}
            onChangeText={(text) => {
              setNeurodivergence(text);
              clearError('neurodivergence');
            }}
            editable={!isLoading}
            error={errors.neurodivergence}
          />
        ) : null}

        {errors.general ? (
          <UmbrellaText variant="caption" color={Colors.light.error} style={styles.generalError}>
            {errors.general}
          </UmbrellaText>
        ) : null}

        <PrimaryButton
          label={isLoading ? 'Criando Conta...' : 'Registrar Conta'}
          icon="checkmark"
          onPress={handleSignUp}
          disabled={isLoading}
        />

        <View style={styles.divider} />

        <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.centeredText}>
          Já possui registro?
        </UmbrellaText>

        <SecondaryButton
          variant="filled"
          label="Voltar para o Login"
          onPress={() => router.back()}
          disabled={isLoading}
        />
      </Card>

      <View style={styles.footer}>
        <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.centeredText}>
          Políticas Acadêmicas · Termos de Segurança
        </UmbrellaText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center', 
    marginBottom: Spacing.lg,
  },
  subtitle: {
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  centeredText: {
    textAlign: 'center', 
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
  footer: {
    gap: Spacing.xs,
    paddingBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
});