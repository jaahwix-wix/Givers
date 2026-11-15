/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getFirebaseConfig() {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw);
}

export async function testConnection() {
  const config = getFirebaseConfig();
  return {
    success: true,
    provider: 'firebase-firestore',
    projectId: config.projectId,
    databaseId: config.firestoreDatabaseId,
    message: `Firebase Cloud Firestore active (${config.projectId} / ${config.firestoreDatabaseId})`,
  };
}

export default { getFirebaseConfig, testConnection };
