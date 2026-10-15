import { databases } from '../src/lib/appwrite/client';
import { appwriteAuth } from '../src/lib/appwrite/auth';
import { APPWRITE_CONFIG } from '../src/lib/appwrite/config';
import { Models, Query } from 'appwrite';
import type { Profile } from '../types/portal';

type ProfileDocument = Models.Document & {
  userId?: unknown;
  name?: unknown;
  full_name?: unknown;
  email?: unknown;
  role?: unknown;
  franchiseId?: unknown;
  active?: unknown;
};

export type AuthFailureKind = 'unauthenticated' | 'forbidden' | 'unavailable' | 'error';

export class AuthRepositoryError extends Error {
  constructor(
    message: string,
    readonly kind: AuthFailureKind,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AuthRepositoryError';
  }
}

function toAuthError(error: unknown, fallback: string): AuthRepositoryError {
  const statusCode = typeof error === 'object' && error !== null && 'code' in error &&
    typeof error.code === 'number' ? error.code : undefined;

  if (statusCode === 401) return new AuthRepositoryError('Sessão não autenticada.', 'unauthenticated', statusCode);
  if (statusCode === 403) return new AuthRepositoryError('Acesso negado ao perfil do Portal.', 'forbidden', statusCode);
  if (statusCode === 408 || (statusCode !== undefined && statusCode >= 500)) {
    return new AuthRepositoryError('O serviço de autenticação está indisponível.', 'unavailable', statusCode);
  }
  if (error instanceof TypeError) {
    return new AuthRepositoryError('Não foi possível conectar ao serviço de autenticação.', 'unavailable');
  }

  return new AuthRepositoryError(error instanceof Error ? error.message : fallback, 'error', statusCode);
}

function adaptProfile(document: ProfileDocument): Profile {
  if (
    typeof document.userId !== 'string' ||
    typeof document.role !== 'string' ||
    typeof document.active !== 'boolean' ||
    (typeof document.name !== 'string' && typeof document.full_name !== 'string')
  ) {
    throw new AuthRepositoryError('O perfil retornado pelo Portal está incompleto.', 'error');
  }

  const role = document.role;
  if (role !== 'admin' && role !== 'naf' && role !== 'franchisee') {
    throw new AuthRepositoryError('O perfil possui um papel inválido.', 'forbidden');
  }

  return {
    id: document.$id,
    userId: document.userId,
    full_name: typeof document.full_name === 'string' ? document.full_name : document.name as string,
    email: typeof document.email === 'string' ? document.email : null,
    role,
    franchiseId: typeof document.franchiseId === 'string' ? document.franchiseId : null,
    active: document.active,
  };
}

export const authRepository = {
  async signIn(email: string, password: string) {
    try {
      await appwriteAuth.login(email, password);
    } catch (error: unknown) {
      throw toAuthError(error, 'Erro ao fazer login');
    }
  },

  async signOut() {
    try {
      await appwriteAuth.logout();
    } catch (error: unknown) {
      throw toAuthError(error, 'Erro ao sair');
    }
  },

  async currentUser() {
    try {
      const user = await appwriteAuth.getCurrentUser();
      return user;
    } catch (error: unknown) {
      const authError = toAuthError(error, 'Erro ao recuperar a sessão');
      if (authError.kind === 'unauthenticated') return null;
      throw authError;
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

      return adaptProfile(result.documents[0]);
    } catch (error) {
      if (error instanceof AuthRepositoryError) throw error;
      throw toAuthError(error, 'Erro ao consultar o perfil');
    }
  },
};
