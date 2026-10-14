import { Client, Teams, ID } from 'node-appwrite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'portal-franqueado-phiq-v4/.env.local');
dotenv.config({ path: envPath });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim())
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim())
    .setKey(process.env.APPWRITE_API_KEY?.trim());

const teams = new Teams(client);

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

async function main() {
    const teamConfigs = [
        { name: 'ADMIN', envKey: 'APPWRITE_ADMIN_TEAM_ID' },
        { name: 'NAF', envKey: 'APPWRITE_NAF_TEAM_ID' },
    ];

    for (const config of teamConfigs) {
        try {
            console.log(`Ensuring team ${config.name}...`);
            // Based on the read file, the method is .create(), not .createTeam()
            const team = await teams.create({
                teamId: ID.unique(),
                name: config.name,
            });
            updateEnv(config.envKey, team.$id);
            console.log(`✅ Team ${config.name} created: ${team.$id}`);
        } catch (e) {
            console.error(`❌ Error creating team ${config.name}: ${e.message}`);
        }
    }
}

main();
