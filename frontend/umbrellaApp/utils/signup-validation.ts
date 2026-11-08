import type { RegisterData } from '@/hooks/api/auth/useAuth';

export const SIGNUP_MESSAGES = {
  name: 'O nome completo é obrigatório.',
  email: 'Insira um e-mail válido.',
  password: 'A senha deve ter pelo menos 6 caracteres.',
  neurodivergence: 'Por favor, informe sua neurodivergência.',
} as const;

export const PASSWORD_MIN_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignUpForm = {
  name: string;
  email: string;
  password: string;
  hasNeurodivergence: boolean;
  neurodivergence: string;
};

export type SignUpErrors = Partial<Record<'name' | 'email' | 'password' | 'neurodivergence', string>>;

export function validateSignUp(form: SignUpForm): SignUpErrors {
  const errors: SignUpErrors = {};

  if (!form.name.trim()) errors.name = SIGNUP_MESSAGES.name;
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = SIGNUP_MESSAGES.email;
  if (form.password.length < PASSWORD_MIN_LENGTH) errors.password = SIGNUP_MESSAGES.password;
  if (form.hasNeurodivergence && !form.neurodivergence.trim()) {
    errors.neurodivergence = SIGNUP_MESSAGES.neurodivergence;
  }

  return errors;
}

export function buildRegisterPayload(form: SignUpForm): RegisterData {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password,
    neurodivergence: form.hasNeurodivergence ? form.neurodivergence.trim() : null,
  };
}
