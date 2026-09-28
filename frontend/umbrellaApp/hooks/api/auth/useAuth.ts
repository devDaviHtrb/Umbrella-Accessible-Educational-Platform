import { useUmbrellaApi } from "../core/useUmbrellaApi";

// Interface para o corpo da requisição de cadastro (Input)
export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

// Interface que espelha exatamente o seu AuthResponseDto do Spring (Output)
export interface AuthResponse {
    accessToken: string;
    tokenType: string;
    userId: string;
    name: string;
    email: string;
    roles: string[]; // O Set<String> do Java vira um array no TypeScript
}

export interface LoginData {
    email: string;
    password: string;
}

export function useAuth() {
    const { post } = useUmbrellaApi();


    const register = async (data: RegisterData): Promise<AuthResponse> => {
        try {

            const response = await post<AuthResponse>("/api/auth/register", data);
            return response;
        } catch (error) {
            console.error("Error during registration:", error);
            throw error;
        }
    };

    const login = async (data: LoginData): Promise<AuthResponse> => {
        try {
            return await post<AuthResponse>("api/auth/login", data);
        } catch (error) {
            console.error("Error during login:", error);
            throw error;
        }
    };

    return { register, login };
}