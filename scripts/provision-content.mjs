import { Client, Databases, Storage, ID } from 'node-appwrite';
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
const storage = new Storage(client);

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

        // 1. Communications Collection
        await ensureCollection(dbId, 'APPWRITE_COMMUNICATIONS_COLLECTION_ID', 'communications', [
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'content', type: 'string', size: 10000, required: true }, // Use longtext/mediumtext in reality if supported
            { key: 'category', type: 'string', size: 50, required: true }, // REDE, TECNICO, etc.
            { key: 'featured', type: 'boolean', required: true },
            { key: 'published', type: 'boolean', required: true },
            { key: 'publishedAt', type: 'datetime', required: false },
            { key: 'createdAt', type: 'datetime', required: true },
            { key: 'updatedAt', type: 'datetime', required: true },
            { key: 'thumbnailId', type: 'string', size: 36, required: false },
            { key: 'mediaUrl', type: 'string', size: 500, required: false },
        ], [
            { key: 'published_idx', type: 'key', attributes: ['published'] },
        ]);

        // 2. Events Collection
        await ensureCollection(dbId, 'APPWRITE_EVENTS_COLLECTION_ID', 'events', [
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'description', type: 'string', size: 5000, required: false },
            { key: 'date', type: 'datetime', required: true },
            { key: 'location', type: 'string', size: 255, required: false },
            { key: 'category', type: 'string', size: 50, required: false },
            { key: 'published', type: 'boolean', required: true },
            { key: 'createdAt', type: 'datetime', required: true },
        ], [
            { key: 'date_idx', type: 'key', attributes: ['date'] },
        ]);

        // 3. Knowledge Base Collection
        await ensureCollection(dbId, 'APPWRITE_KNOWLEDGE_COLLECTION_ID', 'knowledge', [
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'content', type: 'string', size: 10000, required: true },
            { key: 'category', type: 'string', size: 100, required: true }, // e.g. "Operação & Padrões"
            { key: 'subCategory', type: 'string', size: 100, required: false },
            { key: 'parentPageId', type: 'string', size: 36, required: false },
            { key: 'order', type: 'integer', required: true },
            { key: 'published', type: 'boolean', required: true },
            { key: 'createdAt', type: 'datetime', required: true },
            { key: 'updatedAt', type: 'datetime', required: true },
            { key: 'notionId', type: 'string', size: 100, required: false },
        ], [
            { key: 'category_idx', type: 'key', attributes: ['category'] },
            { key: 'parent_idx', type: 'key', attributes: ['parentPageId'] },
        ]);

        // 4. Media Bucket
        const bucketId = process.env.APPWRITE_COMMUNICATION_MEDIA_BUCKET_ID;
        if (!bucketId) {
            console.log('Creating media bucket...');
            const bucket = await storage.createBucket(ID.unique(), 'communication-media', null);
            updateEnv('APPWRITE_COMMUNICATION_MEDIA_BUCKET_ID', bucket.$id);
        }

        console.log('Content provisioning complete.');
    } catch (error) {
        console.error('Content provisioning failed:', error);
        process.exit(1);
    }
}

main();
