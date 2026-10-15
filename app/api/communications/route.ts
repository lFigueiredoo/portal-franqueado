import { NextResponse } from 'next/server';
import { Client, Databases, ID } from 'node-appwrite';
import { APPWRITE_CONFIG } from '@/src/lib/appwrite/config';
import { getAuthenticatedContext } from '@/src/lib/appwrite/server-auth';

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile } = await getAuthenticatedContext(req);
    const { data } = body;
    if (profile.role === 'franchisee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const client = createAdminClient();
    const databases = new Databases(client);

    const communication = await databases.createDocument(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.communications,
        documentId: ID.unique(),
        data: {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
    );

    return NextResponse.json(communication);
  } catch (e: unknown) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { profile } = await getAuthenticatedContext(req);
    const { id, data } = body;
    if (profile.role === 'franchisee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const client = createAdminClient();
    const databases = new Databases(client);

    const updated = await databases.updateDocument(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.communications,
        documentId: id,
        data: {
          ...data,
          updatedAt: new Date().toISOString(),
        }
      }
    );

    return NextResponse.json(updated);
  } catch (e: unknown) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { profile } = await getAuthenticatedContext(req);
    const { id } = body;
    if (profile.role === 'franchisee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const client = createAdminClient();
    const databases = new Databases(client);

    await databases.deleteDocument(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.communications,
        documentId: id
      }
    );

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
