import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'portal-franqueado-phiq-v4/.env.local');
let content = fs.readFileSync(envPath, 'utf8');

// The file has literal "\n" characters as text, not actual newlines
// Example: \nAPPWRITE_DATABASE_ID=6ace5697002452f401cf
const corruptedParts = content.split('\n');
const mainPart = corruptedParts[0];
const corruption = corruptedParts.slice(1).join('\n');

const pairs = [];
const lines = corruption.split('\n');
for (const line of lines) {
    const [key, val] = line.split('=');
    if (key && val) pairs.push({ key: key.trim(), val: val.trim() });
}

const finalLines = mainPart.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    
    const [key] = trimmed.split('=');
    const pair = pairs.find(p => p.key === key);
    if (pair) return `${key}=${pair.val}`;
    return line;
});

fs.writeFileSync(envPath, finalLines.join('\n'), 'utf8');
console.log('Environment file cleaned and fixed.');
