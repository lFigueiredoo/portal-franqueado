import { NextResponse } from 'next/server';
import { Client, Databases, ID } from 'node-appwrite';
import { APPWRITE_CONFIG } from '@/src/lib/appwrite/config';

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const franchiseId = searchParams.get('franchiseId');
    const role = searchParams.get('role');

    if (!userId || !franchiseId || !role) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const client = createAdminClient();
    const databases = new Databases(client);
    const { Query } = await import('appwrite');

    // 1. Get current progress
    const progressResult = await databases.listDocuments(
      APPWRITE_CONFIG.collections.journeyProgress,
      [Query.equal('franchiseId', franchiseId)]
    );
    const progress = progressResult.documents[0];

    // 2. Get completed milestones
    const milestonesResult = await databases.listDocuments(
      APPWRITE_CONFIG.collections.milestoneProgress,
      [Query.equal('franchiseId', franchiseId)]
    );
    const completedMilestones = milestonesResult.documents;

    // 3. Get unlocked achievements
    const achievementsResult = await databases.listDocuments(
      APPWRITE_CONFIG.collections.franchiseAchievements,
      [Query.equal('franchiseId', franchiseId)]
    );
    const unlockedAchievements = achievementsResult.documents;

    return NextResponse.json({
      progress,
      completedMilestones,
      unlockedAchievements,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
