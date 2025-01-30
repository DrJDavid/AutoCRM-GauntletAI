import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Database } from '../src/types/supabase';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Tables in order of dependency (parent tables first)
const RESTORE_ORDER = [
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

async function getLatestBackup() {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    throw new Error('No backups directory found');
  }

  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No backup files found');
  }

  const latestBackup = files[0];
  console.log(`Found latest backup: ${latestBackup}`);
  
  const backupData = JSON.parse(
    fs.readFileSync(path.join(backupDir, latestBackup), 'utf-8')
  );
  
  return backupData;
}

async function restoreData() {
  try {
    const backupData = await getLatestBackup();
    console.log(`Restoring data from backup created at: ${backupData.timestamp}`);

    // Restore each table in order
    for (const table of RESTORE_ORDER) {
      const tableData = backupData.data[table];
      if (!tableData || tableData.length === 0) {
        console.log(`Skipping ${table} - no data to restore`);
        continue;
      }

      console.log(`\nRestoring ${table}...`);
      console.log(`Found ${tableData.length} rows to restore`);

      // Restore in batches of 50 to avoid timeouts
      const batchSize = 50;
      for (let i = 0; i < tableData.length; i += batchSize) {
        const batch = tableData.slice(i, i + batchSize);
        const { error } = await supabase
          .from(table)
          .upsert(batch, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (error) {
          throw new Error(`Error restoring ${table}: ${error.message}`);
        }

        console.log(`✓ Restored rows ${i + 1} to ${i + batch.length}`);
      }

      console.log(`✅ Completed restoring ${tableData.length} rows to ${table}`);
    }

    console.log('\n✅ Data restoration completed successfully');

  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
}

restoreData(); 

