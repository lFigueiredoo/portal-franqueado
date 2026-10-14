import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'portal-franqueado-phiq-v4/.env.local');
const content = fs.readFileSync(envPath, 'utf8');

// Split by the literal "\n" string that was appended
const parts = content.split('\n');
const baseContent = parts[0];
const corruptedData = parts.slice(1).join('\n');

const pairs = {};
corruptedData.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) pairs[key.trim()] = val.trim();
});

const resultLines = baseContent.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const [key] = trimmed.split('=');
    if (pairs[key]) return `${key}=${pairs[key]}`;
    return line;
});

fs.writeFileSync(envPath, resultLines.join('\n'), 'utf8');
console.log('Environment file cleaned and fixed v2.');
