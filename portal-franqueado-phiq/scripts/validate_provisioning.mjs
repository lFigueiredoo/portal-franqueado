import { Client, Databases } from 'node-appwrite';
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
const dbId = process.env.APPWRITE_DATABASE_ID;

async function checkCollection(collId, name) {
    try {
        const coll = await databases.getCollection(dbId, collId);
        const attrs = await databases.listAttributes(dbId, collId);
        console.log(`Collection ${name} (${collId}): ${attrs.total} attributes found.`);
        attrs.documents.forEach(a => console.log(`  - ${a.key} (${a.type})`));
    } catch (e) {
        console.error(`Error checking collection ${name}: ${e.message}`);
    }
}

async function main() {
    if (!dbId) {
        console.error('APPWRITE_DATABASE_ID missing in .env.local');
        process.exit(1);
    }
    await checkCollection(process.env.APPWRITE_PROFILES_COLLECTION_ID, 'profiles');
    await checkCollection(process.env.APPWRITE_FRANCHISES_COLLECTION_ID, 'franchises');
    await checkCollection(process.env.APPWRITE_TICKETS_COLLECTION_ID, 'tickets');
    await checkCollection(process.env.APPWRITE_TICKET_MESSAGES_COLLECTION_ID, 'ticket_messages');
    await checkCollection(process.env.APPWRITE_TICKET_ATTACHMENTS_COLLECTION_ID, 'ticket_attachments');
}

main();
