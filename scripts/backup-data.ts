import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import type { Database } from '@/types/supabase';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

const TABLES_TO_BACKUP = [
  'organizations',
  'profiles',
  'tickets',
  'ticket_messages',
  'ticket_attachments',
  'ai_agents',
  'ai_agent_assignments',
  'ai_agent_responses',
  'invitations'
] as const;

type BackupData = {
  timestamp: string;
  data: Record<string, any[]>;
};

async function ensureBackupDirectory() {
  const backupDir = path.join(process.cwd(), 'backups');
  try {
    await fs.promises.mkdir(backupDir, { recursive: true });
    return backupDir;
  } catch (error) {
    console.error('Failed to create backups directory:', error);
    throw error;
  }
}

async function backupData() {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-'); // Make filename Windows-safe
    const backupData: BackupData = {
      timestamp,
      data: {}
    };

    // Ensure backups directory exists
    const backupDir = await ensureBackupDirectory();

    // Backup each table
    for (const table of TABLES_TO_BACKUP) {
      console.log(`Backing up ${table}...`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Error backing up ${table}: ${error.message}`);
      }

      backupData.data[table] = data || [];
      console.log(`✓ Backed up ${data?.length || 0} rows from ${table}`);
    }

    // Save backup to file
    const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
    try {
      await fs.promises.writeFile(backupPath, JSON.stringify(backupData, null, 2));
      console.log(`\n✅ Backup completed successfully: ${backupPath}`);
    } catch (error) {
      console.error('Failed to write backup file:', error);
      throw error;
    }

  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

backupData(); 

