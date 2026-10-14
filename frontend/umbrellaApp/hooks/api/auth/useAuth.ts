import { useUmbrellaApi } from "../core/useUmbrellaApi";
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    tokenType: string;
    userId: string;
    name: string;
    email: string;
    roles: string[];
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthFieldErrors {
    name?: string;
    email?: string;
    password?: string;
    general?: string;
}

export class AuthError extends Error {
    fieldErrors: AuthFieldErrors;
    statusCode?: number;

    constructor(message: string, fieldErrors: AuthFieldErrors = {}, statusCode?: number) {
        super(message);
        this.name = "AuthError";
        this.fieldErrors = fieldErrors;
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AuthError.prototype);
    }
}

function parseAuthError(error: any, type: 'login' | 'register'): AuthError {
    const fieldErrors: AuthFieldErrors = {};

    if (error.response) {
        const data = error.response.data;
        const status = (typeof data?.status === 'string' ? data.status : '') || '';
        const rawMessage =
            (typeof data?.message === 'string' ? data.message : '') ||
            (typeof data === 'string' ? data : '');
        const code = error.response.status || data?.code;

        const lowerMessage = rawMessage.toLowerCase();
        const lowerStatus = status.toLowerCase();

        // 1. DataIntegrityViolationException / Unique constraint violation (Email already registered)
        const isConflict =
            code === 409 ||
            lowerStatus.includes('integrity') ||
            lowerMessage.includes('duplicate') ||
            lowerMessage.includes('unique') ||
            lowerMessage.includes('constraint') ||
            lowerMessage.includes('already exists') ||
            lowerMessage.includes('já existe') ||
            lowerMessage.includes('users_email_key') ||
            lowerMessage.includes('email');

        if (type === 'register' && (isConflict || lowerStatus.includes('integrity'))) {
            if (lowerMessage.includes('name') || lowerMessage.includes('nome') || lowerMessage.includes('username')) {
                fieldErrors.name = 'Este nome de usuário já está em uso.';
            } else {
                fieldErrors.email = 'Este e-mail já está cadastrado.';
            }
            return new AuthError('Usuário ou e-mail já cadastrado.', fieldErrors, code);
        }

        // 2. Validation failed (MethodArgumentNotValidException / ConstraintViolationException)
        if (lowerStatus.includes('validation') || rawMessage.includes(':')) {
            const cleanMessage = rawMessage.replace(/^Validation failed:\s*/i, '');
            const parts = cleanMessage.split(/,\s*(?=[a-zA-Z0-9_]+:)/);
            for (const part of parts) {
                const colonIdx = part.indexOf(':');
                if (colonIdx !== -1) {
                    const field = part.slice(0, colonIdx).trim().toLowerCase();
                    const detail = part.slice(colonIdx + 1).trim();

                    if (field.includes('name') || field.includes('nome')) {
                        fieldErrors.name = detail.toLowerCase().includes('blank') || detail.toLowerCase().includes('vazio')
                            ? 'Nome é obrigatório.'
                            : detail;
                    } else if (field.includes('email')) {
                        fieldErrors.email = 'Insira um endereço de e-mail válido.';
                    } else if (field.includes('password') || field.includes('senha')) {
                        fieldErrors.password = 'A senha deve ter no mínimo 6 caracteres.';
                    }
                }
            }

            if (Object.keys(fieldErrors).length > 0) {
                return new AuthError('Dados inválidos fornecidos.', fieldErrors, code);
            }
        }

        // 3. Unauthorized / Bad credentials on login
        if (
            code === 401 ||
            lowerStatus.includes('unauthorized') ||
            lowerMessage.includes('bad credentials') ||
            lowerMessage.includes('authentication failed') ||
            lowerMessage.includes('não autorizado')
        ) {
            fieldErrors.general = 'E-mail ou senha incorretos.';
            return new AuthError('E-mail ou senha incorretos.', fieldErrors, code);
        }

        // 4. Bad request (IllegalArgumentException) or other custom message
        if (rawMessage) {
            if (lowerMessage.includes('email')) {
                fieldErrors.email = rawMessage;
            } else if (lowerMessage.includes('senha') || lowerMessage.includes('password')) {
                fieldErrors.password = rawMessage;
            } else if (lowerMessage.includes('nome') || lowerMessage.includes('name')) {
                fieldErrors.name = rawMessage;
            } else {
                fieldErrors.general = rawMessage;
            }
            return new AuthError(rawMessage, fieldErrors, code);
        }

        const defaultMsg = type === 'login' ? 'Erro ao realizar login.' : 'Erro ao cadastrar conta.';
        fieldErrors.general = defaultMsg;
        return new AuthError(defaultMsg, fieldErrors, code);
    }

    if (error.request || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        const netMsg = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
        fieldErrors.general = netMsg;
        return new AuthError(netMsg, fieldErrors, 0);
    }

    const fallbackMsg = (typeof error.message === 'string' && error.message) ? error.message : 'Erro inesperado. Tente novamente.';
    fieldErrors.general = fallbackMsg;
    return new AuthError(fallbackMsg, fieldErrors, 500);
}

export function useAuth() {
    const { post } = useUmbrellaApi();

    const register = async (data: RegisterData): Promise<AuthResponse> => {
        try {
            const response = await post<AuthResponse>("auth/register", data);
            return response;
        } catch (error: any) {
            console.log("[useAuth register error]", error.response?.data || error.message);
            throw parseAuthError(error, 'register');
        }
    };

    const login = async (data: LoginData): Promise<AuthResponse> => {
        try {
            const response = await post<AuthResponse>("auth/login", data);

            if (response && response.accessToken) {
                const userData = {
                    id: String(response.userId),
                    name: response.name,
                    email: response.email,
                    roles: response.roles || [],
                };
                await AsyncStorage.setItem("@user_name", response.name);
                await AsyncStorage.setItem("@user_token", response.accessToken);
                await AsyncStorage.setItem("@user_data", JSON.stringify(userData));
            }

            return response;
        } catch (error: any) {
            console.log("[useAuth login error]", error.response?.data || error.message);
            throw parseAuthError(error, 'login');
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem("@user_name");
            await AsyncStorage.removeItem("@user_token");
        } catch (error) {
            console.log("Error during logout:", error);
        }
    };

    return { register, login, logout };
}
