import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth as useAuthApi, LoginData, RegisterData, AuthResponse } from '@/hooks/api/auth/useAuth';

export interface UserData {
    id: string;
    name: string;
    email: string;
    roles: string[];
}

export interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: UserData | null;
    userName: string | null;
    userEmail: string | null;
    userId: string | null;
    userRoles: string[];
    userToken: string | null;
    login: (data: LoginData) => Promise<AuthResponse>;
    register: (data: RegisterData) => Promise<AuthResponse>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { login: apiLogin, register: apiRegister, logout: apiLogout } = useAuthApi();

    const [userToken, setUserToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Verifica se já existe um token e dados do usuário salvos ao abrir o app
    useEffect(() => {
        async function loadStorageData() {
            try {
                const [token, storedUser, storedName] = await Promise.all([
                    AsyncStorage.getItem('@user_token'),
                    AsyncStorage.getItem('@user_data'),
                    AsyncStorage.getItem('@user_name'),
                ]);

                if (token) {
                    setUserToken(token);
                    if (storedUser) {
                        try {
                            const parsed = JSON.parse(storedUser);
                            setUser(parsed);
                        } catch {
                            if (storedName) {
                                setUser({ id: '', name: storedName, email: '', roles: [] });
                            }
                        }
                    } else if (storedName) {
                        setUser({ id: '', name: storedName, email: '', roles: [] });
                    }
                }
            } catch (error) {
                console.log("[AuthContext] Erro ao carregar dados do Storage:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadStorageData();
    }, []);

    // 2. Função de Login integrada ao Contexto
    const login = async (data: LoginData): Promise<AuthResponse> => {
        const response = await apiLogin(data);
        if (response && response.accessToken) {
            const userData: UserData = {
                id: response.userId,
                name: response.name,
                email: response.email,
                roles: response.roles || [],
            };
            setUserToken(response.accessToken);
            setUser(userData);
            await Promise.all([
                AsyncStorage.setItem('@user_token', response.accessToken),
                AsyncStorage.setItem('@user_data', JSON.stringify(userData)),
                AsyncStorage.setItem('@user_name', response.name),
            ]);
        }
        return response;
    };

    // 3. Função de Cadastro integrada ao Contexto
    const register = async (data: RegisterData): Promise<AuthResponse> => {
        const response = await apiRegister(data);
        return response;
    };

    // 4. Função de Logout integrada ao Contexto
    const logout = async () => {
        try {
            await apiLogout();
            await AsyncStorage.multiRemove(['@user_token', '@user_name', '@user_data']);
        } catch (error) {
            console.log("[AuthContext] Erro ao deslogar:", error);
        } finally {
            setUserToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!userToken,
                isLoading,
                user,
                userName: user?.name || null,
                userEmail: user?.email || null,
                userId: user?.id || null,
                userRoles: user?.roles || [],
                userToken,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Hook customizado para facilitar o uso nas telas
export function useAuthContext() {
    return useContext(AuthContext);
}
