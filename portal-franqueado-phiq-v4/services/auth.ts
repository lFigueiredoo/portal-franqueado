import { account, databases } from '../src/lib/appwrite/client';
import { appwriteAuth } from '../src/lib/appwrite/auth';
import { APPWRITE_CONFIG } from '../src/lib/appwrite/config';
import { Query } from 'appwrite';
import type { Profile } from '../types/portal';

export const authRepository = {
  async signIn(email: string, password: string) {
    try {
      await appwriteAuth.login(email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login');
    }
  },

  async signOut() {
    try {
      await appwriteAuth.logout();
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao sair');
    }
  },

  async currentUser() {
    try {
      const user = await appwriteAuth.getCurrentUser();
      return user;
    } catch (error) {
      return null;
    }
  },

  async currentProfile(userId: string): Promise<Profile | null> {
    try {
      // Appwrite listDocuments expects queries as a string array or as separate arguments depending on SDK version
      // Using a spread or correct array type. In the JS SDK, it is typically [Query.equal(...), Query.limit(...)]
      // But if the type error says string[], we might need to cast or check SDK.
      // Actually, listDocuments query parameter is string[], but Query.equal returns a string.
      const result = await databases.listDocuments(
        APPWRITE_CONFIG.collections.profiles,
        [
          Query.equal('userId', userId),
          Query.limit(1)
        ] as any
      );

      if (result.documents.length === 0) return null;

      return result.documents[0] as unknown as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },
};
