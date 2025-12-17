// utils/gaClient.js  (ESM)
import fs from 'fs';
import path from 'path';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

function parseJsonEnv(value) {
  if (!value) return null;
  value = value.trim();
  if (value.startsWith('{')) {
    try { return JSON.parse(value); } 
    catch (e) { throw new Error('GA_SERVICE_ACCOUNT contains invalid JSON: ' + e.message); }
  }
  const tryPath = path.isAbsolute(value) ? value : path.join(process.cwd(), value);
  if (!fs.existsSync(tryPath)) {
    throw new Error(`GA_SERVICE_ACCOUNT looks like a file path but file not found: ${tryPath}`);
  }
  try {
    const fileContents = fs.readFileSync(tryPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (e) {
    throw new Error('Failed reading/parsing GA service account file: ' + e.message);
  }
}

export function createGaClient() {
  const envVal = process.env.GA_SERVICE_ACCOUNT;
  if (!envVal) throw new Error('GA credentials not found. Set GA_SERVICE_ACCOUNT (JSON string or file path).');
  const cred = parseJsonEnv(envVal);
  return new BetaAnalyticsDataClient({ credentials: cred });
}
