import { Client, Databases, Users, Teams, Storage, ID } from 'node-appwrite';
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
const users = new Users(client);
const teams = new Teams(client);
const storage = new Storage(client);

function updateEnv(key, value) {
    if (!value) return;
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\\n');
    const index = lines.findIndex(line => line.trim().startsWith(`${key}=`));
    if (index !== -1) {
        lines[index] = `${key}=${value}`;
    } else {
        lines.push(`${key}=${value}`);
    }
    fs.writeFileSync(envPath, lines.join('\\n'), 'utf8');
}

async function ensureDatabase(name) {
    const dbId = process.env.APPWRITE_DATABASE_ID;
    if (dbId) {
        try {
            await databases.get(dbId);
            return dbId;
        } catch (e) {}
    }
    const db = await databases.create(ID.unique(), name);
    updateEnv('APPWRITE_DATABASE_ID', db.$id);
    return db.$id;
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

async function ensureTeam(name, envKey) {
    try {
        const team = await teams.getTeam(name);
        updateEnv(envKey, team.$id);
        return team.$id;
    } catch (e) {
        return name;
    }
}

async function ensureBucket(envKey, name) {
    let bucketId = process.env[envKey];
    if (bucketId) {
        try {
            await storage.getBucket(bucketId);
            return bucketId;
        } catch (e) {}
    }
    const bucket = await storage.createBucket(ID.unique(), name, null);
    updateEnv(envKey, bucket.$id);
    return bucket.$id;
}

async function main() {
    try {
        console.log('Starting provision...');
        const dbId = await ensureDatabase('Portal Database');

        await ensureCollection(dbId, 'APPWRITE_PROFILES_COLLECTION_ID', 'profiles', [
            { key: 'userId', type: 'string', size: 36, required: true },
            { key: 'name', type: 'string', size: 255, required: false },
            { key: 'email', type: 'string', size: 255, required: true },
            { key: 'role', type: 'string', size: 50, required: true },
            { key: 'franchiseId', type: 'string', size: 36, required: false },
            { key: 'active', type: 'boolean', required: true },
            { key: 'avatarFileId', type: 'string', size: 36, required: false },
            { key: 'createdAt', type: 'datetime', required: true },
            { key: 'updatedAt', type: 'datetime', required: true },
        ], [
            { key: 'userId', type: 'unique', attributes: ['userId'] },
        ]);

        await ensureCollection(dbId, 'APPWRITE_FRANCHISES_COLLECTION_ID', 'franchises', [
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'slug', type: 'string', size: 255, required: true },
            { key: 'city', type: 'string', size: 255, required: false },
            { key: 'state', type: 'string', size: 50, required: false },
            { key: 'responsibleName', type: 'string', size: 255, required: false },
            { key: 'responsibleUserId', type: 'string', size: 36, required: false },
            { key: 'csUserId', type: 'string', size: 36, required: false },
            { key: 'status', type: 'string', size: 50, required: true },
            { key: 'journeyStage', type: 'string', size: 100, required: false },
            { key: 'journeyProgress', type: 'integer', required: false },
            { key: 'level', type: 'integer', required: false },
            { key: 'coins', type: 'integer', required: false },
            { key: 'latitude', type: 'string', size: 50, required: false },
            { key: 'longitude', type: 'string', size: 50, required: false },
            { key: 'phone', type: 'string', size: 50, required: false },
            { key: 'email', type: 'string', size: 255, required: false },
            { key: 'active', type: 'boolean', required: true },
            { key: 'createdAt', type: 'datetime', required: true },
            { key: 'updatedAt', type: 'datetime', required: true },
        ], [
            { key: 'slug', type: 'unique', attributes: ['slug'] },
        ]);

        await ensureCollection(dbId, 'APPWRITE_TICKETS_COLLECTION_ID', 'tickets', [
            { key: 'protocol', type: 'string', size: 50, required: true },
            { key: 'franchiseId', type: 'string', size: 36, required: true },
            { key: 'createdBy', type: 'string', size: 36, required: true },
            { key: 'assignedTo', type: 'string', size: 36, required: false },
            { key: 'type', type: 'string', size: 100, required: true },
            { key: 'subject', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 5000, required: true },
            { key: 'status', type: 'string', size: 50, required: true },
            { key: 'priority', type: 'string', size: 50, required: true },
            { key: 'createdAt', type: 'datetime', required: true },
            { key: 'updatedAt', type: 'datetime', required: true },
            { key: 'closedAt', type: 'datetime', required: false },
        ], [
            { key: 'protocol', type: 'unique', attributes: ['protocol'] },
            { key: 'franchiseId', type: 'key', attributes: ['franchiseId'] },
        ]);

        await ensureCollection(dbId, 'APPWRITE_TICKET_MESSAGES_COLLECTION_ID', 'ticket_messages', [
            { key: 'ticketId', type: 'string', size: 36, required: true },
            { key: 'authorId', type: 'string', size: 36, required: true },
            { key: 'message', type: 'string', size: 10000, required: true },
            { key: 'internal', type: 'boolean', required: true },
            { key: 'createdAt', type: 'datetime', required: true },
        ], [
            { key: 'ticketId', type: 'key', attributes: ['ticketId'] },
        ]);

        await ensureCollection(dbId, 'APPWRITE_TICKET_ATTACHMENTS_COLLECTION_ID', 'ticket_attachments', [
            { key: 'ticketId', type: 'string', size: 36, required: true },
            { key: 'fileId', type: 'string', size: 36, required: true },
            { key: 'fileName', type: 'string', size: 255, required: true },
            { key: 'mimeType', type: 'string', size: 100, required: true },
            { key: 'size', type: 'integer', required: true },
            { key: 'uploadedBy', type: 'string', size: 36, required: true },
            { key: 'createdAt', type: 'datetime', required: true },
        ], [
            { key: 'ticketId', type: 'key', attributes: ['ticketId'] },
        ]);

        await ensureBucket('APPWRITE_TICKET_ATTACHMENTS_BUCKET_ID', 'ticket-attachments');

        await ensureTeam('ADMIN', 'APPWRITE_ADMIN_TEAM_ID');
        await ensureTeam('NAF', 'APPWRITE_NAF_TEAM_ID');

        console.log('Provisioning complete.');
    } catch (error) {
        console.error('Provisioning failed:', error);
        process.exit(1);
    }
}

main();
