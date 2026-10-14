import { NextResponse } from 'next/server';
import { Client, Databases, ID } from 'node-appwrite';
import { APPWRITE_CONFIG } from '@/src/lib/appwrite/config';
import crypto from 'crypto';
import type { Profile } from '@/types/portal';

function createAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.APPWRITE_API_KEY!);
}

// Helper for compact deterministic IDs (max 36 chars)
function generateCompactId(prefix: string, ...parts: string[]) {
  const hash = crypto.createHash('sha256').update(parts.join(':')).digest('hex').substring(0, 20);
  return `${prefix}_${hash}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, profile, progressId, status, observations } = body;

    if (!userId || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileTyped = profile as Profile;
    if (profileTyped.role === 'franchisee') {
      return NextResponse.json({ error: 'Forbidden: Only NAF/ADMIN can approve' }, { status: 403 });
    }

    const client = createAdminClient();
    const databases = new Databases(client);

    const progress = await databases.getDocument({
      databaseId: APPWRITE_CONFIG.databaseId,
      collectionId: APPWRITE_CONFIG.collections.milestoneProgress,
      documentId: progressId
    });

    if (progress.status === 'Approved') {
      return NextResponse.json({ error: 'Milestone already approved.' }, { status: 400 });
    }

    const milestone = await databases.getDocument({
      databaseId: APPWRITE_CONFIG.databaseId,
      collectionId: APPWRITE_CONFIG.collections.journeyMilestones,
      documentId: progress.milestoneId
    });

    if (status === 'Approved') {
      // Appwrite DocumentsDB atomic updates are per-document.
      // For multi-doc consistency, we implement a deterministic sequence
      // and a final aggregate update.

      // 1. Update Progress (Locking state)
      await databases.updateDocument(
        {
          databaseId: APPWRITE_CONFIG.databaseId,
          collectionId: APPWRITE_CONFIG.collections.milestoneProgress,
          documentId: progressId,
          data: {
            status: 'Approved',
            completedAt: new Date().toISOString(),
            validatedBy: userId,
            observations: observations
          }
        }
      );

      // 2. Idempotent Coin Grant
      if (milestone.points > 0) {
        const ledgerId = generateCompactId('coin', progress.franchiseId, progress.milestoneId);
        try {
          await databases.createDocument(
            {
              databaseId: APPWRITE_CONFIG.databaseId,
              collectionId: APPWRITE_CONFIG.collections.coinLedger,
              documentId: ledgerId,
              data: {
                franchiseId: progress.franchiseId,
                operationType: 'CREDIT',
                amount: milestone.points,
                origin: `milestone:${milestone.$id}`,
                createdAt: new Date().toISOString(),
                responsibleId: userId
              }
            }
          );
        } catch (e: unknown) {
          const err = e as { code?: number };
          if (err.code !== 409) throw e; // Ignore duplicate grants
        }
      }

      // 3. Idempotent Achievement Unlock
      if (milestone.required) {
        const achievementId = `medal_${milestone.level}`;
        const achId = generateCompactId('ach', progress.franchiseId, achievementId);
        try {
          await databases.createDocument(
            {
              databaseId: APPWRITE_CONFIG.databaseId,
              collectionId: APPWRITE_CONFIG.collections.franchiseAchievements,
              documentId: achId,
              data: {
                franchiseId: progress.franchiseId,
                achievementId: achievementId,
                unlockedAt: new Date().toISOString(),
                validatedBy: userId,
                eventReference: `Milestone ${milestone.title} completed`
              }
            }
          );
        } catch (e: unknown) {
          const err = e as { code?: number };
          if (err.code !== 409) throw e;
        }
      }

      // 4. Audit Log
      await databases.createDocument(
        {
          databaseId: APPWRITE_CONFIG.databaseId,
          collectionId: APPWRITE_CONFIG.collections.journeyAuditLog,
          documentId: ID.unique(),
          data: {
            franchiseId: progress.franchiseId,
            action: 'MILESTONE_APPROVED',
            details: `Approved milestone ${milestone.title}`,
            timestamp: new Date().toISOString(),
            userId: userId
          }
        }
      );

      // 5. Recalculate Total Progress (Simplified for MVP)
      // Fetch all completed milestones for this franchise
      const completed = await databases.listDocuments(
        {
          databaseId: APPWRITE_CONFIG.databaseId,
          collectionId: APPWRITE_CONFIG.collections.milestoneProgress,
          queries: []
        }
      );

      // logic to calculate percentage based on total milestones in levels...
      // await databases.updateDocument(APPWRITE_CONFIG.collections.journeyProgress, ...)

    } else {
      await databases.updateDocument(
        {
          databaseId: APPWRITE_CONFIG.databaseId,
          collectionId: APPWRITE_CONFIG.collections.milestoneProgress,
          documentId: progressId,
          data: {
            status: 'Rejected',
            observations: observations,
            validatedBy: userId
          }
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
