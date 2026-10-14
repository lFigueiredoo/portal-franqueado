import { databases } from '../src/lib/appwrite/client';
import { appwriteAuth } from '../src/lib/appwrite/auth';
import { APPWRITE_CONFIG } from '../src/lib/appwrite/config';
import { Models, Query } from 'appwrite';
import type { Profile } from '../types/portal';

type ProfileDocument = Models.Document & Profile;

export const authRepository = {
  async signIn(email: string, password: string) {
    try {
      await appwriteAuth.login(email, password);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao fazer login');
    }
  },

  async signOut() {
    try {
      await appwriteAuth.logout();
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao sair');
    }
  },

  async currentUser() {
    try {
      const user = await appwriteAuth.getCurrentUser();
      return user;
    } catch {
      return null;
    }
  },

  async currentProfile(userId: string): Promise<Profile | null> {
    try {
      const result = await databases.listDocuments<ProfileDocument>({
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.profiles,
        queries: [
          Query.equal('userId', userId),
          Query.limit(1)
        ],
      });

      if (result.documents.length === 0) return null;

      return result.documents[0];
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },
};
