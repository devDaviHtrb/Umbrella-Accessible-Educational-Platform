import { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { router } from 'expo-router';

import { AppHeader } from '@/components/layout/app-header';
import { ScreenContainer } from '@/components/layout/screen-container';
import { Card } from '@/components/ui/card';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SecondaryButton } from '@/components/ui/secondary-button';
import { TextField } from '@/components/ui/text-field';
import { UmbrellaText } from '@/components/ui/umbrella-text';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/api/auth/useAuth'; // Ajuste o caminho conforme sua estrutura

export default function SignUpScreen() {
    const { register } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSignUp() {
        if (!name || !email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await register({ name, email, password });

            console.log('Conta criada com sucesso! Token:', response.accessToken);
            Alert.alert('Sucesso', 'Sua conta Umbrella foi criada!', [
                { text: 'Ir para o App', onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (error: any) {
            Alert.alert('Falha no Cadastro', 'Não foi possível criar sua conta. Verifique os dados ou tente outro e-mail.');
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
                    icon="person.fill" // Se o seu pacote de ícones tiver person
                    placeholder="Seu Nome Completo"
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                    editable={!isLoading}
                />

                <TextField
                    label="Endereço de E-mail"
                    icon="envelope.fill"
                    placeholder="estudante@umbrella.edu"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                />

                <TextField
                    label="Senha"
                    icon="lock.fill"
                    placeholder="Mínimo 6 caracteres"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                />

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
