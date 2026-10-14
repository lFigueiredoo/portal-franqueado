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

async function validateAttributes() {
    const dbId = process.env.APPWRITE_DATABASE_ID;
    const collections = {
        profiles: {
            id: process.env.APPWRITE_PROFILES_COLLECTION_ID,
            attrs: ['userId', 'name', 'email', 'role', 'franchiseId', 'active', 'avatarFileId', 'createdAt', 'updatedAt']
        },
        franchises: {
            id: process.env.APPWRITE_FRANCHISES_COLLECTION_ID,
            attrs: ['name', 'slug', 'city', 'state', 'responsibleName', 'responsibleUserId', 'csUserId', 'status', 'journeyStage', 'journeyProgress', 'level', 'coins', 'latitude', 'longitude', 'phone', 'email', 'active', 'createdAt', 'updatedAt']
        },
        tickets: {
            id: process.env.APPWRITE_TICKETS_COLLECTION_ID,
            attrs: ['protocol', 'franchiseId', 'createdBy', 'assignedTo', 'type', 'subject', 'description', 'status', 'priority', 'createdAt', 'updatedAt', 'closedAt']
        },
        ticket_messages: {
            id: process.env.APPWRITE_TICKET_MESSAGES_COLLECTION_ID,
            attrs: ['ticketId', 'authorId', 'message', 'internal', 'createdAt']
        },
        ticket_attachments: {
            id: process.env.APPWRITE_TICKET_ATTACHMENTS_COLLECTION_ID,
            attrs: ['ticketId', 'fileId', 'fileName', 'mimeType', 'size', 'uploadedBy', 'createdAt']
        },
    };

    console.log(`Validating Attributes in DB: ${dbId}\n`);

    for (const [name, config] of Object.entries(collections)) {
        if (!config.id) {
            console.error(`❌ ${name}: Missing ID in .env.local`);
            continue;
        }
        try {
            const result = await databases.listAttributes(dbId, config.id);
            const existingAttrs = result.attributes.map(a => a.key);
            console.log(`Collection ${name} (${config.id}):`);
            
            for (const attr of config.attrs) {
                if (existingAttrs.includes(attr)) {
                    console.log(`  ✅ ${attr}`);
                } else {
                    console.error(`  ❌ ${attr} (MISSING)`);
                }
            }
            console.log('');
        } catch (e) {
            console.error(`❌ ${name}: Error listing attributes: ${e.message}\n`);
        }
    }
}

validateAttributes();
