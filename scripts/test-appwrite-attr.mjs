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

async function test() {
    const dbId = process.env.APPWRITE_DATABASE_ID;
    const collId = process.env.APPWRITE_TICKETS_COLLECTION_ID;

    if (!dbId || !collId) {
        console.error('Missing Database or Collection ID in .env.local');
        process.exit(1);
    }

    console.log(`Testing attribute creation in DB: ${dbId}, Coll: ${collId}`);

    try {
        const testKey = `test_attr_${Date.now()}`;
        console.log(`Attempting to create string attribute: ${testKey}`);
        
        await databases.createStringAttribute(
            dbId, 
            collId, 
            testKey, 
            255, 
            false
        );
        console.log('✅ Success with positional arguments!');
    } catch (e) {
        console.error('❌ Failed with positional arguments:', e.message);
        try {
            const testKeyObj = `test_attr_${Date.now()}`;
            console.log(`Attempting to create string attribute (Object): ${testKeyObj}`);
            await databases.createStringAttribute({
                databaseId: dbId,
                collectionId: collId,
                key: testKeyObj,
                size: 255,
                required: false
            });
            console.log('✅ Success with object arguments!');
        } catch (e2) {
            console.error('❌ Failed with object arguments:', e2.message);
        }
    }
}

test();
