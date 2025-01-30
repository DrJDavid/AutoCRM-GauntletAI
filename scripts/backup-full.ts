import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tables to backup from the main database
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

// Storage buckets to backup
const STORAGE_BUCKETS = [
  'attachments',
  'avatars'
] as const;

type BackupData = {
  timestamp: string;
  data: Record<string, any[]>;
  auth: {
    users: any[];
    identities: any[];
  };
  storage: {
    files: Record<string, {
      path: string;
      metadata: any;
      content?: string; // Base64 encoded for binary files
    }[]>;
  };
};

async function ensureBackupDirectory() {
  const backupDir = path.join(process.cwd(), 'backups');
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const fullBackupDir = path.join(backupDir, `full-backup-${timestamp}`);
  
  try {
    await fs.promises.mkdir(fullBackupDir, { recursive: true });
    await fs.promises.mkdir(path.join(fullBackupDir, 'storage'), { recursive: true });
    return { backupDir, fullBackupDir, timestamp };
  } catch (error) {
    console.error('Failed to create backup directories:', error);
    throw error;
  }
}

async function backupDatabaseData() {
  console.log('\nBacking up database data...');
  const data: Record<string, any[]> = {};

  for (const table of TABLES_TO_BACKUP) {
    console.log(`Backing up ${table}...`);
    const { data: tableData, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error backing up ${table}: ${error.message}`);
    }

    data[table] = tableData || [];
    console.log(`✓ Backed up ${tableData?.length || 0} rows from ${table}`);
  }

  return data;
}

async function backupAuthData() {
  console.log('\nBacking up auth data...');
  try {
    // Get all users (including their auth metadata)
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;
    console.log(`✓ Backed up ${users.users.length} users`);

    return {
      users: users.users,
      identities: [] // Auth identities are managed internally by Supabase
    };
  } catch (error) {
    console.error('Failed to backup auth data:', error);
    throw error;
  }
}

async function backupStorageData(fullBackupDir: string) {
  console.log('\nBacking up storage data...');
  const storageData: BackupData['storage']['files'] = {};

  for (const bucket of STORAGE_BUCKETS) {
    console.log(`\nBacking up ${bucket} bucket...`);
    try {
      // List all files in the bucket
      const { data: files, error: listError } = await supabase
        .storage
        .from(bucket)
        .list();
      if (listError) throw listError;

      storageData[bucket] = [];
      const bucketDir = path.join(fullBackupDir, 'storage', bucket);
      await fs.promises.mkdir(bucketDir, { recursive: true });

      // Download each file
      for (const file of files || []) {
        const { data, error: downloadError } = await supabase
          .storage
          .from(bucket)
          .download(file.name);
        if (downloadError) throw downloadError;

        // Save file to backup directory
        const filePath = path.join(bucketDir, file.name);
        await fs.promises.writeFile(filePath, Buffer.from(await data.arrayBuffer()));

        storageData[bucket].push({
          path: file.name,
          metadata: file,
        });
      }

      console.log(`✓ Backed up ${files?.length || 0} files from ${bucket}`);
    } catch (error) {
      console.error(`Failed to backup ${bucket} bucket:`, error);
      throw error;
    }
  }

  return storageData;
}

async function createFullBackup() {
  try {
    // Create backup directories
    const { fullBackupDir, timestamp } = await ensureBackupDirectory();
    
    // Initialize backup data structure
    const backupData = {
      timestamp,
      data: {},
      auth: {
        users: [],
        identities: []
      },
      storage: {
        files: {}
      }
    };

    // Backup all data types
    backupData.data = await backupDatabaseData();
    backupData.auth = await backupAuthData();
    backupData.storage.files = await backupStorageData(fullBackupDir);

    // Save backup manifest
    const manifestPath = path.join(fullBackupDir, 'backup-manifest.json');
    await fs.promises.writeFile(
      manifestPath,
      JSON.stringify(backupData, null, 2)
    );

    console.log(`\n✅ Full backup completed successfully: ${fullBackupDir}`);
    console.log('Backup includes:');
    console.log('- Database data');
    console.log('- Auth data');
    console.log('- Storage files');
    console.log(`\nManifest file: ${manifestPath}`);

  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

createFullBackup(); 