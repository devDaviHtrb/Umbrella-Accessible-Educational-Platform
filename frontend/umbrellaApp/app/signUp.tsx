import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth, AuthFieldErrors } from '@/hooks/api/auth/useAuth';

export default function SignUpScreen() {
    const { register } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<AuthFieldErrors>({});

    function validate() {
        const newErrors: AuthFieldErrors = {};
        if (!name.trim()) {
            newErrors.name = 'Nome é obrigatório.';
        }

        if (!email.trim()) {
            newErrors.email = 'E-mail é obrigatório.';
        } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
            newErrors.email = 'Insira um e-mail válido.';
        }

        if (!password) {
            newErrors.password = 'Senha é obrigatória.';
        } else if (password.length < 6) {
            newErrors.password = 'A senha deve ter no mínimo 6 caracteres.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSignUp() {
        if (!validate()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            await register({
                name: name.trim(),
                email: email.trim(),
                password,
            });

            console.log('Conta criada com sucesso! Redirecionando para login...');
            router.replace('/login');
        } catch (error: any) {
            if (error && error.fieldErrors) {
                setErrors(error.fieldErrors);
            } else {
                setErrors({
                    general: error.message || 'Não foi possível criar sua conta. Tente novamente.',
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
                    Crie sua{'\n'}
                    <UmbrellaText variant="display" color={Colors.light.primary}>
                        Jornada.
                    </UmbrellaText>
                </UmbrellaText>
                <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.subtitle}>
                    Inicie sua imersão no ecossistema Umbrella. Um ambiente unificado para gerenciar seus módulos de aprendizado e progresso.
                </UmbrellaText>
            </View>

            <Card style={styles.card}>
                <View>
                    <UmbrellaText variant="title">Criar Conta</UmbrellaText>
                    <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.cardSubtitle}>
                        Cadastre as credenciais do seu nó de acesso estudantil.
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
                        if (errors.name || errors.general) {
                            setErrors((prev) => ({ ...prev, name: undefined, general: undefined }));
                        }
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
                    placeholder="Mínimo 6 caracteres"
                    secureTextEntry
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

                <PrimaryButton
                    label={isLoading ? "Criando Conta..." : "Registrar Conta"}
                    icon="checkmark"
                    onPress={handleSignUp}
                    disabled={isLoading}
                />

                <View style={styles.divider} />

                <UmbrellaText variant="body" color={Colors.light.textSecondary} style={styles.centered}>
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
                <UmbrellaText variant="caption" color={Colors.light.textSecondary} style={styles.centered}>
                    Políticas Acadêmicas · Termos de Segurança
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
