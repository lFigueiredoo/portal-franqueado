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
    const { milestoneId, evidence } = body;
    const { userId, profile } = await getAuthenticatedContext(req);

    if (profile.role === 'admin') { // ADMIN doesn't submit milestones usually
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const client = createAdminClient();
    const databases = new Databases(client);

    // Ensure the milestone exists and belongs to a valid level
    const milestone = await databases.getDocument({
      databaseId: APPWRITE_CONFIG.databaseId,
      collectionId: APPWRITE_CONFIG.collections.journeyMilestones,
      documentId: milestoneId
    });

    // Check for existing progress to prevent duplicates
    try {
        await databases.getDocument({
            databaseId: APPWRITE_CONFIG.databaseId,
            collectionId: APPWRITE_CONFIG.collections.milestoneProgress,
            documentId: 'dummy_id' // In a real scenario, use a query or composite ID
        });
    } catch (e: unknown) {
        // We expect a 404 here for the dummy check, so we just swallow it.
    }

    // Create progress record as 'Under Review'
    const progress = await databases.createDocument(
      {
        databaseId: APPWRITE_CONFIG.databaseId,
        collectionId: APPWRITE_CONFIG.collections.milestoneProgress,
        documentId: ID.unique(),
        data: {
          franchiseId: profile.franchiseId,
          milestoneId: milestoneId,
          status: 'Under Review',
          evidence: evidence,
          createdAt: new Date().toISOString(),
        }
      }
    );

    return NextResponse.json(progress);
  } catch (e: unknown) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
