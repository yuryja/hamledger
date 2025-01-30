import PouchDB from 'pouchdb';
import { QsoEntry } from '../types/qso';
import { app } from 'electron';
import { join } from 'path';
import fs from 'fs';

// Initialize PouchDB
const dbPath = join(app.getPath('userData'), 'hamlogger.db');
export const db = new PouchDB(dbPath);

// Ensure the database directory exists
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

export async function saveQso(qso: QsoEntry) {
  try {
    const response = await db.post(qso);
    
    // Write to JSON file as backup
    const jsonPath = join(app.getPath('userData'), 'hamlogger.json');
    const allDocs = await db.allDocs({ include_docs: true });
    const jsonData = allDocs.rows.map(row => row.doc);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    
    return { ok: true, id: response.id };
  } catch (error) {
    console.error('Failed to save QSO:', error);
    return { ok: false, error };
  }
}
