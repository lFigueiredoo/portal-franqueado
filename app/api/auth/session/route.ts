import { NextResponse } from 'next/server';
import { Account } from 'node-appwrite';
import {
  APPWRITE_SESSION_COOKIE,
  createAuthAdminClient,
  createUnauthenticatedClient,
  getAuthenticatedContext,
} from '@/src/lib/appwrite/server-auth';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function errorStatus(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error &&
    typeof error.code === 'number' && error.code >= 400 && error.code < 500) {
    return error.code;
  }
  return 500;
}

function requestAddress(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const address = requestAddress(request);
  const current = loginAttempts.get(address);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(address, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > LOGIN_MAX_ATTEMPTS;
}

export async function GET(request: Request) {
  try {
    const context = await getAuthenticatedContext(request);
    console.info('[auth] session_get_completed', {
      httpStatus: 200,
      profileFound: true,
      profileActive: context.profile.active,
    });
    return NextResponse.json(context);
  } catch (error) {
    const status = error instanceof Response ? error.status : errorStatus(error);
    console.warn('[auth] session_get_failed', {
      httpStatus: status,
      category: error instanceof Response ? 'authorization' : 'error',
    });
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Unable to load session' }, { status });
  }
}

export async function POST(request: Request) {
  let sessionCreated = false;
  let sessionSecretPresent = false;
  let sessionSecretNonEmpty = false;
  let cookieSet = false;
  try {
    if (isRateLimited(request)) {
      return NextResponse.json({ error: 'Unable to sign in' }, { status: 429 });
    }
    const body = await request.json() as { email?: unknown; password?: unknown };
    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const account = new Account(createAuthAdminClient());
    const session = await account.createEmailPasswordSession({
      email: body.email.trim(),
      password: body.password,
    });
    sessionCreated = Boolean(session);
    sessionSecretPresent = typeof session?.secret === 'string';
    sessionSecretNonEmpty = sessionSecretPresent && session.secret.trim().length > 0;
    const sessionNotExpired = typeof session?.expire === 'string'
      && Date.parse(session.expire) > Date.now();
    if (!sessionSecretNonEmpty || !sessionNotExpired) {
      console.error('[auth] session_create_invalid', {
        sessionCreated,
        sessionSecretPresent,
        sessionSecretNonEmpty,
        sessionNotExpired,
        cookieSet,
        httpStatus: 502,
      });
      return NextResponse.json({ error: 'Authentication session was not created' }, { status: 502 });
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: APPWRITE_SESSION_COOKIE,
      value: session.secret,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires: new Date(session.expire),
    });
    cookieSet = true;
    console.info('[auth] session_created', {
      sessionCreated,
      sessionSecretPresent,
      sessionSecretNonEmpty,
      sessionNotExpired,
      cookieSet,
      httpStatus: 200,
    });
    return response;
  } catch (error) {
    console.warn('[auth] session_create_failed', {
      sessionCreated,
      sessionSecretPresent,
      sessionSecretNonEmpty,
      cookieSet,
      httpStatus: errorStatus(error),
      category: errorStatus(error) === 401 ? 'unauthenticated' : 'error',
    });
    return NextResponse.json({ error: 'Unable to sign in' }, { status: errorStatus(error) });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookie = cookieHeader.split(';').map((value) => value.trim())
      .find((value) => value.startsWith(`${APPWRITE_SESSION_COOKIE}=`));
    if (cookie) {
      const session = decodeURIComponent(cookie.slice(APPWRITE_SESSION_COOKIE.length + 1));
      await new Account(createUnauthenticatedClient().setSession(session)).deleteSession('current');
    }
  } catch {
    // The local cookie is cleared even when Appwrite has already expired the session.
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: APPWRITE_SESSION_COOKIE, value: '', expires: new Date(0), path: '/' });
  return response;
}
