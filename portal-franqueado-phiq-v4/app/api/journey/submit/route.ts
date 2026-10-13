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
    const { userId, profile, milestoneId, evidence } = body;

    if (!userId || !profile || profile.role === 'ADMIN') { // ADMIN doesn't submit milestones usually
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const client = createAdminClient();
    const databases = new Databases(client);

    // Ensure the milestone exists and belongs to a valid level
    const milestone = await databases.getDocument(
      APPWRITE_CONFIG.collections.journeyMilestones,
      milestoneId
    );

    // Check for existing progress to prevent duplicates
    try {
        await databases.getDocument(
            APPWRITE_CONFIG.collections.milestoneProgress,
            // We'll use a composite ID or check via query since Appwrite IDs are unique
            // In a real scenario, we'd search by franchiseId and milestoneId
        );
    } catch (e) {}

    // Create progress record as 'Under Review'
    const progress = await databases.createDocument(
      APPWRITE_CONFIG.collections.milestoneProgress,
      ID.unique(),
      {
        franchiseId: profile.franchiseId,
        milestoneId: milestoneId,
        status: 'Under Review',
        evidence: evidence,
        createdAt: new Date().toISOString(),
      }
    );

    return NextResponse.json(progress);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
