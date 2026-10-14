import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'portal-franqueado-phiq-v4/.env.local');
dotenv.config({ path: envPath });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim())
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim())
    .setKey(process.env.APPWRITE_API_KEY?.trim());

const databases = new Databases(client);

function updateEnv(key, value) {
    if (!value) return;
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    const index = lines.findIndex(line => line.trim().startsWith(`${key}=`));
    if (index !== -1) {
        lines[index] = `${key}=${value}`;
    } else {
        lines.push(`${key}=${value}`);
    }
    fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
}

async function ensureCollection(dbId, envKey, name, attributes, indexes) {
    let collId = process.env[envKey];
    if (collId) {
        try {
            await databases.getCollection(dbId, collId);
            return collId;
        } catch (e) {}
    }

    console.log(`Creating collection ${name}...`);
    const coll = await databases.createCollection(dbId, ID.unique(), name);

    for (const attr of attributes) {
        try {
            if (attr.type === 'string') {
                await databases.createStringAttribute({
                    databaseId: dbId,
                    collectionId: coll.$id,
                    key: attr.key,
                    size: attr.size || 255,
                    required: attr.required ?? false
                });
            } else if (attr.type === 'boolean') {
                await databases.createBooleanAttribute({
                    databaseId: dbId,
                    collectionId: coll.$id,
                    key: attr.key,
                    required: attr.required ?? false
                });
            } else if (attr.type === 'integer') {
                await databases.createIntegerAttribute({
                    databaseId: dbId,
                    collectionId: coll.$id,
                    key: attr.key,
                    required: attr.required ?? false
                });
            } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute({
                    databaseId: dbId,
                    collectionId: coll.$id,
                    key: attr.key,
                    required: attr.required ?? false
                });
            }
        } catch (e) {
            console.error(`Failed to create attribute ${attr.key} in ${name}: ${e.message}`);
        }
    }
    for (const index of indexes) {
        try {
            await databases.createIndex({
                databaseId: dbId,
                collectionId: coll.$id,
                key: index.key,
                type: index.type,
                attributes: index.attributes
            });
        } catch (e) {
            console.error(`Failed to create index ${index.key} in ${name}: ${e.message}`);
        }
    }
    updateEnv(envKey, coll.$id);
    return coll.$id;
}

async function main() {
    try {
        const dbId = process.env.APPWRITE_DATABASE_ID;
        if (!dbId) throw new Error('APPWRITE_DATABASE_ID is missing');

        await ensureCollection(dbId, 'APPWRITE_JOURNEY_LEVELS_COLLECTION_ID', 'journey_levels', [
            { key: 'name', type: 'string', size: 100, required: true },
            { key: 'order', type: 'integer', required: true },
            { key: 'description', type: 'string', size: 1000, required: false },
        ], [
            { key: 'order_idx', type: 'key', attributes: ['order'] },
        ]);

        await ensureCollection(dbId, 'APPWRITE_JOURNEY_MILESTONES_COLLECTION_ID', 'journey_milestones', [
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 2000, required: false },
            { key: 'level', type: 'integer', required: true },
            { key: 'stage', type: 'string', size: 100, required: true },
            { key: 'order', type: 'integer', required: true },
            { key: 'weight', type: 'integer', required: true },
            { key: 'required', type: 'boolean', required: true },
            { key: 'criteria', type: 'string', size: 1000, required: false },
            { key: 'points', type: 'integer', required: true },
            { key: 'status', type: 'string', size: 50, required: true },
        ], [
            { key: 'level_idx', type: 'key', attributes: ['level'] },
            { key: 'stage_idx', type: 'key', attributes: ['stage'] },
        ]);

        await ensureCollection(dbId, 'APPWRITE_MILESTONE_PROGRESS_COLLECTION_ID', 'milestone_progress', [
            { key: 'franchiseId', type: 'string', size: 36, required: true },
            { key: 'milestoneId', type: 'string', size: 36, required: true },
            { key: 'status', type: 'string', size: 50, required: true },
            { key: 'evidence', type: 'string', size: 1000, required: false },
            { key: 'completedAt', type: 'datetime', required: false },
            { key: 'validatedBy', type: 'string', size: 36, required: false },
            { key: 'observations', type: 'string', size: 2000, required: false },
        ], [
            { key: 'franchise_milestone_idx', type: 'unique', attributes: ['franchiseId', 'milestoneId'] },
        ]);

        await ensureCollection(dbId, 'APPWRITE_JOURNEY_PROGRESS_COLLECTION_ID', 'journey_progress', [
            { key: 'franchiseId', type: 'string', size: 36, required: true },
            { key: 'currentLevel', type: 'integer', required: true },
            { key: 'currentStage', type: 'string', size: 100, required: true },
            { key: 'totalProgress', type: 'integer', required: true },
            { key: 'coinsBalance', type: 'integer', required: true },
            { key: 'updatedAt', type: 'datetime', required: true },
        ], [
            { key: 'franchise_idx', type: 'unique', attributes: ['franchiseId'] },
        ]);

        await ensureCollection(dbId, 'APPWRITE_ACHIEVEMENTS_COLLECTION_ID', 'achievements', [
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 1000, required: false },
            { key: 'criteria', type: 'string', size: 1000, required: false },
            { key: 'assetKey', type: 'string', size: 100, required: true },
            { key: 'rewardCoins', type: 'integer', required: true },
            { key: 'order', type: 'integer', required: true },
            { key: 'status', type: 'string', size: 50, required: true },
        ], []);

        await ensureCollection(dbId, 'APPWRITE_FRANCHISE_ACHIEVEMENTS_COLLECTION_ID', 'franchise_achievements', [
            { key: 'franchiseId', type: 'string', size: 36, required: true },
            { key: 'achievementId', type: 'string', size: 36, required: true },
            { key: 'unlockedAt', type: 'datetime', required: true },
            { key: 'validatedBy', type: 'string', size: 36, required: false },
            { key: 'eventReference', type: 'string', size: 255, required: false },
        ], [
            { key: 'franchise_achievement_idx', type: 'unique', attributes: ['franchiseId', 'achievementId'] },
        ]);

        await ensureCollection(dbId, 'APPWRITE_COIN_LEDGER_COLLECTION_ID', 'coin_ledger', [
            { key: 'franchiseId', type: 'string', size: 36, required: true },
            { key: 'operationType', type: 'string', size: 50, required: true },
            { key: 'amount', type: 'integer', required: true },
            { key: 'origin', type: 'string', size: 255, required: true },
            { key: 'createdAt', type: 'datetime', required: true },
            { key: 'responsibleId', type: 'string', size: 36, required: false },
        ], [
            { key: 'franchise_date_idx', type: 'key', attributes: ['franchiseId', 'createdAt'] },
        ]);

        await ensureCollection(dbId, 'APPWRITE_JOURNEY_AUDIT_LOG_COLLECTION_ID', 'journey_audit_log', [
            { key: 'franchiseId', type: 'string', size: 36, required: true },
            { key: 'action', type: 'string', size: 255, required: true },
            { key: 'details', type: 'string', size: 2000, required: false },
            { key: 'timestamp', type: 'datetime', required: true },
            { key: 'userId', type: 'string', size: 36, required: true },
        ], []);

        console.log('Journey provisioning complete.');
    } catch (error) {
        console.error('Journey provisioning failed:', error);
        process.exit(1);
    }
}

main();
