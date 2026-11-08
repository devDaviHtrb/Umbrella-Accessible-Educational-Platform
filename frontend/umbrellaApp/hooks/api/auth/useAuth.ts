import { useUmbrellaApi } from "../core/useUmbrellaApi";

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    neurodivergence: string | null;
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

        const isConflict =
            code === 409 ||
            lowerStatus.includes('integrity') ||
            lowerMessage.includes('duplicate') ||
            lowerMessage.includes('unique') ||
            lowerMessage.includes('constraint') ||
            lowerMessage.includes('already exists') ||
            lowerMessage.includes('já existe') ||
            lowerMessage.includes('users_email_key');

        if (type === 'register' && isConflict) {
            fieldErrors.email = 'Este e-mail já está cadastrado.';
            return new AuthError('Este e-mail já está cadastrado.', fieldErrors, code);
        }

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
            return await post<AuthResponse>("auth/register", data);
        } catch (error: any) {
            console.log("[useAuth register error]", error.response?.status ?? error.message);
            throw parseAuthError(error, 'register');
        }
    };

    const login = async (data: LoginData): Promise<AuthResponse> => {
        try {
            return await post<AuthResponse>("auth/login", data);
        } catch (error: any) {
            console.log("[useAuth login error]", error.response?.status ?? error.message);
            throw parseAuthError(error, 'login');
        }
    };

    return { register, login };
}
