import { isAxiosError } from 'axios';
import { classifyApiFailure } from '../../infrastructure/http/apiErrorKind';
import { api } from '../../infrastructure/http/Api';
import { User } from './types/user';

/** Respuesta de GET/PATCH user/me y usuario en login (alineado con backend). */
export interface UserResponse {
  id: string;
  email: string;
  globalRole: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

const mapUserResponse = (data: UserResponse): User => {
  return {
    id: data.id,
    email: data.email,
    globalRole: data.globalRole,
    firstName: data.firstName ?? undefined,
    lastName: data.lastName ?? undefined,
    phone: data.phone ?? undefined,
  };
};

export type LoadMeResult =
  | { ok: true; user: User }
  | { ok: false; kind: 'transport' | 'server' | 'auth' | 'other' };

export const loadMe = async (): Promise<LoadMeResult> => {
  try {
    const { data } = await api.get<UserResponse>('user/me');
    return { ok: true, user: mapUserResponse(data) };
  } catch (error) {
    console.error('Error loading user info:', error);
    const kind = classifyApiFailure(error);
    if (kind === 'auth') return { ok: false, kind: 'auth' };
    if (kind === 'server') return { ok: false, kind: 'server' };
    if (kind === 'transport') return { ok: false, kind: 'transport' };
    return { ok: false, kind: 'other' };
  }
};

export const updateMe = async (
  email?: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
): Promise<User | null> => {
  try {
    const updateData: Partial<{
      email: string;
      firstName: string;
      lastName: string;
      phone: string;
    }> = {};

    if (email !== undefined) {
      updateData.email = email;
    }
    if (firstName !== undefined) {
      updateData.firstName = firstName;
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName;
    }
    if (phone !== undefined) {
      updateData.phone = phone;
    }

    const { data } = await api.patch<UserResponse>('user/me', updateData);
    return mapUserResponse(data);
  } catch (error) {
    console.error('Error updating user info:', error);
    return null;
  }
};

export type DeleteMeResult =
  | { success: true }
  | { success: false; message: string };

/** Elimina la cuenta en el servidor (soft delete). */
export const deleteMe = async (): Promise<DeleteMeResult> => {
  try {
    await api.delete<{ success: boolean }>('user/me');
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    let message = 'No se pudo eliminar la cuenta. Intenta de nuevo más tarde.';
    if (isAxiosError(error) && error.response?.data) {
      const data = error.response.data as { message?: string | string[] };
      if (typeof data.message === 'string') {
        message = data.message;
      } else if (Array.isArray(data.message)) {
        message = data.message.join(' ');
      }
    }
    return { success: false, message };
  }
};
