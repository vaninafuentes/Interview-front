import { apiRequest } from '@/services/api';
import type { AuthSession, LoginPayload, RegisterPayload } from '@/types/auth';

export function login(payload: LoginPayload) {
  return apiRequest<AuthSession>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthSession>('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
