import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'portal-franqueado-phiq-v4/.env.local');
dotenv.config({ path: envPath });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim())
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim())
    .setKey(process.env.APPWRITE_API_KEY?.trim());

const databases = new Databases(client);

async function validate() {
    const dbId = process.env.APPWRITE_DATABASE_ID;
    const collections = [
        { id: process.env.APPWRITE_PROFILES_COLLECTION_ID, name: 'profiles' },
        { id: process.env.APPWRITE_FRANCHISES_COLLECTION_ID, name: 'franchises' },
        { id: process.env.APPWRITE_TICKETS_COLLECTION_ID, name: 'tickets' },
        { id: process.env.APPWRITE_TICKET_MESSAGES_COLLECTION_ID, name: 'ticket_messages' },
        { id: process.env.APPWRITE_TICKET_ATTACHMENTS_COLLECTION_ID, name: 'ticket_attachments' },
    ];

    console.log(`Validating Database: ${dbId}`);

    for (const coll of collections) {
        if (!coll.id) {
            console.error(`❌ ${coll.name}: Missing ID in .env.local`);
            continue;
        }
        try {
            await databases.getCollection(dbId, coll.id);
            console.log(`✅ ${coll.name}: Found (${coll.id})`);
        } catch (e) {
            console.error(`❌ ${coll.name}: Not found or error: ${e.message}`);
        }
    }
}

validate();
