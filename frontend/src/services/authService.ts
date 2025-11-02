import axios from '@/lib/axios';
import type {
  User,
  LoginRequest,
  ForgotPasswordRequest,
  SignUpRequest,
  ResetPasswordRequest
} from '@/types/auth.types';

export const authService = {
  async signup(data: SignUpRequest) {
    const res = await axios.post('/v1/auth/signup', data);
    return res.data;
  },

  async login(data: LoginRequest): Promise<User> {
    const res = await axios.post<User>('/v1/auth/login', data);
    const user = res.data;
    return user;
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<User> {
    const res = await axios.post<User>('/v1/auth/forgot-password', data);
    return res.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<User> {
    const res = await axios.post<User>('/v1/auth/reset-password', data);
    return res.data;
  },

  async logout(): Promise<void> {
    await axios.post('/v1/auth/logout');
  },

  async getSession(): Promise<User | null> {
    const res = await axios.get<User>('/v1/auth/session');
    const user = res.data;
    return user;
  }
};
