import axios from '@/lib/axios';
import type { SignUpRequest } from '@/types/auth.types';

export const userService = {
  async create(data: SignUpRequest) {
    const res = await axios.post('/v1/users', data);
    return res.data;
  }
};
