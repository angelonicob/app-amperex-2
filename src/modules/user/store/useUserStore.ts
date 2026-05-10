import { create } from 'zustand';
import { User } from '../types/user';
import { updateMe } from '../user';

export interface UserState {
  user?: User;
  setUser: (user: User) => void;
  clearUser: () => void;
  updateUser: (
    email?: string,
    firstName?: string,
    lastName?: string,
    phone?: string,
  ) => Promise<boolean>;
}

export const useUserStore = create<UserState>()(set => ({
  user: undefined,

  setUser: (user: User) => {
    set({ user });
  },

  clearUser: () => {
    set({ user: undefined });
  },

  updateUser: async (email?: string, firstName?: string, lastName?: string, phone?: string) => {
    try {
      const updatedUser = await updateMe(email, firstName, lastName, phone);
      if (updatedUser) {
        set({ user: updatedUser });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user in store:', error);
      return false;
    }
  },
}));
