import fs from 'fs';

export const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));