import { NextResponse } from 'next/server';
import { Client, Databases, ID } from 'node-appwrite';
import { APPWRITE_CONFIG } from '@/src/lib/appwrite/config';

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, profile, data } = body;

    if (!userId || !profile || profile.role === 'FRANQUEADO') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const client = createAdminClient();
    const databases = new Databases(client);

    const page = await databases.createDocument(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.knowledge,
        documentId: ID.unique(),
        data: {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }
    );

    return NextResponse.json(page);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, userId, profile, data } = body;

    if (!userId || !profile || profile.role === 'FRANQUEADO') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const client = createAdminClient();
    const databases = new Databases(client);

    const updated = await databases.updateDocument(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.knowledge,
        documentId: id,
        data: {
          ...data,
          updatedAt: new Date().toISOString(),
        }
      }
    );

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id, userId, profile } = body;

    if (!userId || !profile || profile.role === 'FRANQUEADO') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const client = createAdminClient();
    const databases = new Databases(client);

    await databases.deleteDocument(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.knowledge,
        documentId: id
      }
    );

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
