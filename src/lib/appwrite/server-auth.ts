import { Account, Client, Databases, Models, Query } from 'node-appwrite';
import { APPWRITE_CONFIG } from './config';
import type { PortalRole, Profile } from '@/types/portal';

export const APPWRITE_SESSION_COOKIE = `a_session_${APPWRITE_CONFIG.projectId}`;

type ProfileDocument = Models.Document & {
  userId?: unknown;
  name?: unknown;
  full_name?: unknown;
  email?: unknown;
  role?: unknown;
  franchiseId?: unknown;
  active?: unknown;
};

export type AuthenticatedContext = {
  userId: string;
  profile: Profile;
};

function createSessionClient(session: string) {
  return new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId)
    .setSession(session);
}

export function createAuthAdminClient() {
  const apiKey = process.env.APPWRITE_AUTH_API_KEY;
  if (!apiKey) {
    throw new Error('APPWRITE_AUTH_API_KEY is not configured');
  }
  return new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId)
    .setKey(apiKey);
}

function createDataAdminClient() {
  const apiKey = process.env.APPWRITE_PROFILE_READ_API_KEY;
  if (!apiKey) {
    throw new Error('APPWRITE_PROFILE_READ_API_KEY is not configured');
  }
  return new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId)
    .setKey(apiKey);
}

function profileFromDocument(document: ProfileDocument): Profile | null {
  const role = typeof document.role === 'string' ? document.role.toLowerCase() : '';
  const fullName = typeof document.full_name === 'string'
    ? document.full_name
    : document.name;

  if (
    typeof document.userId !== 'string' ||
    typeof fullName !== 'string' ||
    (role !== 'admin' && role !== 'naf' && role !== 'franchisee') ||
    typeof document.active !== 'boolean'
  ) {
    return null;
  }

  return {
    id: document.$id,
    userId: document.userId,
    full_name: fullName,
    email: typeof document.email === 'string' ? document.email : null,
    role: role as PortalRole,
    franchiseId: typeof document.franchiseId === 'string' ? document.franchiseId : null,
    active: document.active,
  };
}

export async function getAuthenticatedContext(request: Request): Promise<AuthenticatedContext> {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookie = cookieHeader.split(';').map((value) => value.trim())
    .find((value) => value.startsWith(`${APPWRITE_SESSION_COOKIE}=`));
  const session = cookie?.slice(APPWRITE_SESSION_COOKIE.length + 1);

  console.info('[auth] session_lookup', { cookiePresent: Boolean(session) });
  if (!session) {
    throw new Response('Unauthenticated', { status: 401 });
  }

  let accountGetSucceeded = false;
  try {
    const client = createSessionClient(decodeURIComponent(session));
    const account = new Account(client);
    const user = await account.get();
    accountGetSucceeded = true;
    console.info('[auth] session_recognized', {
      cookiePresent: true,
      cookieNonEmpty: session.trim().length > 0,
      accountGetSucceeded: true,
    });
    const databases = new Databases(createDataAdminClient());
    const result = await databases.listDocuments<ProfileDocument>({
      databaseId: APPWRITE_CONFIG.databaseId,
      collectionId: APPWRITE_CONFIG.collections.profiles,
      queries: [Query.equal('userId', user.$id), Query.limit(2)],
    });
    if (result.documents.length > 1) {
      console.warn('[auth] profile_lookup_ambiguous', {
        profileFound: true,
        profileActive: false,
        httpStatus: 409,
        category: 'duplicate_profile',
      });
      throw new Response('Multiple profiles found', { status: 409 });
    }
    const profile = result.documents[0] ? profileFromDocument(result.documents[0]) : null;
    console.info('[auth] profile_lookup', {
      profileFound: Boolean(profile),
      profileActive: profile?.active === true,
    });

    if (!profile) {
      throw new Response('Profile missing', { status: 403 });
    }

    if (profile.userId !== user.$id || !profile.active) {
      throw new Response('Profile inactive', { status: 403 });
    }

    return { userId: user.$id, profile };
  } catch (error) {
    if (error instanceof Response) throw error;
    console.warn('[auth] session_lookup_failed', {
      cookiePresent: true,
      cookieNonEmpty: session.trim().length > 0,
      accountGetSucceeded,
      httpStatus: typeof error === 'object' && error !== null && 'code' in error
        && typeof error.code === 'number' ? error.code : 500,
      category: typeof error === 'object' && error !== null && 'type' in error
        && typeof error.type === 'string' ? error.type : 'error',
    });
    throw error;
  }
}

export function createUnauthenticatedClient() {
  return new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);
}
