import PouchDB from 'pouchdb';
import { QsoEntry } from '../types/qso';
import { app } from 'electron';
import { join } from 'path';
import fs from 'fs';

export class DatabaseService {
  private db!: PouchDB.Database;
  private dbPath: string;

  constructor() {
    this.dbPath = join(app.getPath('userData'), 'hamlogger.db');
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
    this.db = new PouchDB(this.dbPath);
  }

  public async saveQso(qso: QsoEntry): Promise<{ ok: boolean; id?: string; error?: any }> {
    try {
      const response = await this.db.post(qso);
      await this.backupToJson();
      return { ok: true, id: response.id };
    } catch (error) {
      console.error('Failed to save QSO:', error);
      return { ok: false, error };
    }
  }

  public async updateQso(qso: QsoEntry): Promise<{ ok: boolean; id?: string; error?: any }> {
    try {
      const response = await this.db.put(qso);
      await this.backupToJson();
      return { ok: true, id: response.id };
    } catch (error) {
      console.error('Failed to update QSO:', error);
      return { ok: false, error };
    }
  }

  public async getAllQsos(): Promise<QsoEntry[]> {
    try {
      const allDocs = await this.db.allDocs({ include_docs: true });
      return allDocs.rows.map(row => {
        const qso = row.doc as QsoEntry;
        // Ensure _id and _rev are present from the row metadata
        qso._id = row.id;
        qso._rev = row.value.rev;
        return qso;
      });
    } catch (error) {
      console.error('Failed to get QSOs:', error);
      return [];
    }
  }

  private async backupToJson(): Promise<void> {
    try {
      const jsonPath = join(app.getPath('userData'), 'hamlogger.json');
      const allDocs = await this.db.allDocs({ include_docs: true });
      const jsonData = allDocs.rows.map(row => row.doc);
      fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    } catch (error) {
      console.error('Failed to backup database:', error);
    }
  }
}

export const databaseService = new DatabaseService();
