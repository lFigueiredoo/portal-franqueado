import { Client, Databases, Teams, Storage } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'portal-franqueado-phiq-v4/.env.local');
dotenv.config({ path: envPath });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim())
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim())
    .setKey(process.env.APPWRITE_API_KEY?.trim());

const databases = new Databases(client);
const teams = new Teams(client);
const storage = new Storage(client);

async function verify() {
    const dbId = process.env.APPWRITE_DATABASE_ID;
    console.log(`--- Final Provisioning Check (DB: ${dbId}) ---`);

    // 1. Validate Bucket
    const bucketId = process.env.APPWRITE_TICKET_ATTACHMENTS_BUCKET_ID;
    try {
        await storage.getBucket(bucketId);
        console.log(`✅ Bucket: ${bucketId} exists`);
    } catch (e) {
        console.error(`❌ Bucket: ${bucketId} MISSING`);
    }

    // 2. Validate Teams
    const teamIds = [
        { envKey: 'APPWRITE_ADMIN_TEAM_ID', name: 'ADMIN' },
        { envKey: 'APPWRITE_NAF_TEAM_ID', name: 'NAF' },
    ];
    for (const team of teamIds) {
        const id = process.env[team.envKey];
        try {
            if (!id) throw new Error('Missing ID in env');
            await teams.get(id);
            console.log(`✅ Team ${team.name}: Found (${id})`);
        } catch (e) {
            console.error(`❌ Team ${team.name}: Missing or not found (${id})`);
        }
    }

    // 3. Validate Indexes
    const ticketsCollId = process.env.APPWRITE_TICKETS_COLLECTION_ID;
    try {
        const result = await databases.listIndexes(dbId, ticketsCollId);
        const indexes = result.indexes.map(i => i.key);
        console.log(`✅ Ticket Indexes: ${indexes.join(', ')}`);
        if (!indexes.includes('protocol')) console.error('  ⚠️ Missing protocol index');
        if (!indexes.includes('franchiseId')) console.error('  ⚠️ Missing franchiseId index');
    } catch (e) {
        console.error(`❌ Ticket Indexes: Error listing: ${e.message}`);
    }
}

verify();
