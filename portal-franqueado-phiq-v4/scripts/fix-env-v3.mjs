import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'portal-franqueado-phiq-v4/.env.local');
const content = fs.readFileSync(envPath, 'utf8');

// The issue is that the previous "fix" might have deleted too much or messed up the structure.
// Let's just rebuild the .env.local from the known values we saw in the Read output.

const knownValues = {
    'NEXT_PUBLIC_APPWRITE_ENDPOINT': 'https://api.edocs.phiq.com.br/v1',
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID': '6ace53aa000ae6aca1eb',
    'APPWRITE_API_KEY': 'standard_a7de38ff4481f7f2e402f3b3dcc357a6c874293beb4c4081769e7c5ff17db54be001b8ec19812393e119584bddb53643dc6d402122d586af5c53e7ef7ca1bd6d354c4c4074d363e8d69deed50bfdd0674a3f357cd0f9fe7373b060804e9a0ff437718c47bb5b816657855094fe0a471ed3b504def7915b253bf9366a17521fb6',
    'APPWRITE_DATABASE_ID': '6ace5697002452f401cf',
    'APPWRITE_PROFILES_COLLECTION_ID': '6ace5d6e003b0e5ade6b',
    'APPWRITE_FRANCHISES_COLLECTION_ID': '6ace5d71000b9867c21c',
    'APPWRITE_TICKETS_COLLECTION_ID': '6ace5d750011813fc9b9',
    'APPWRITE_TICKET_MESSAGES_COLLECTION_ID': '6ace5d770034c7509ae9',
    'APPWRITE_TICKET_ATTACHMENTS_COLLECTION_ID': '6ace5d780038a995f739',
    'APPWRITE_TICKET_ATTACHMENTS_BUCKET_ID': '6ace5d7a001f68d4cfe1',
};

const finalLines = [
    '# Appwrite Configuration',
    'NEXT_PUBLIC_APPWRITE_ENDPOINT=' + knownValues.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID=' + knownValues.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    '',
    '# Server-only (Secret)',
    'APPWRITE_API_KEY=' + knownValues.APPWRITE_API_KEY,
    '',
    '# Appwrite Teams',
    'APPWRITE_ADMIN_TEAM_ID=',
    'APPWRITE_NAF_TEAM_ID=',
    '',
    '# Appwrite Database IDs',
    'APPWRITE_DATABASE_ID=' + knownValues.APPWRITE_DATABASE_ID,
    'APPWRITE_PROFILES_COLLECTION_ID=' + knownValues.APPWRITE_PROFILES_COLLECTION_ID,
    'APPWRITE_FRANCHISES_COLLECTION_ID=' + knownValues.APPWRITE_FRANCHISES_COLLECTION_ID,
    'APPWRITE_TICKETS_COLLECTION_ID=' + knownValues.APPWRITE_TICKETS_COLLECTION_ID,
    'APPWRITE_TICKET_MESSAGES_COLLECTION_ID=' + knownValues.APPWRITE_TICKET_MESSAGES_COLLECTION_ID,
    'APPWRITE_TICKET_ATTACHMENTS_COLLECTION_ID=' + knownValues.APPWRITE_TICKET_ATTACHMENTS_COLLECTION_ID,
    '',
    '# Appwrite Storage Bucket IDs',
    'APPWRITE_TICKET_ATTACHMENTS_BUCKET_ID=' + knownValues.APPWRITE_TICKET_ATTACHMENTS_BUCKET_ID,
];

fs.writeFileSync(envPath, finalLines.join('\n'), 'utf8');
console.log('Environment file rebuilt from known values.');
