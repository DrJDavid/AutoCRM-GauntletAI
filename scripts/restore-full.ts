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

// Tables in reverse dependency order for deletion
const DELETE_ORDER = [
  'ai_agent_responses',
  'ai_agent_assignments',
  'ai_agents',
  'ticket_messages',
  'ticket_attachments',
  'tickets',
  'profiles',
  'organizations'
] as const;

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

async function getLatestFullBackup() {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    throw new Error('No backups directory found');
  }

  const fullBackups = fs.readdirSync(backupDir)
    .filter(dir => dir.startsWith('full-backup-'))
    .sort()
    .reverse();

  if (fullBackups.length === 0) {
    throw new Error('No full backup directories found');
  }

  const latestBackup = fullBackups[0];
  const manifestPath = path.join(backupDir, latestBackup, 'backup-manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Backup manifest not found in ${latestBackup}`);
  }

  console.log(`Found latest backup: ${latestBackup}`);
  const backupData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  return { backupData, backupDir: path.join(backupDir, latestBackup) };
}

async function restoreStorageData(storageData: any, backupDir: string) {
  console.log('\nRestoring storage data...');

  for (const [bucket, files] of Object.entries<any[]>(storageData.files)) {
    console.log(`\nRestoring ${bucket} bucket...`);
    try {
      for (const file of files) {
        const filePath = path.join(backupDir, 'storage', bucket, file.path);
        const fileContent = await fs.promises.readFile(filePath);
        
        const { error } = await supabase
          .storage
          .from(bucket)
          .upload(file.path, fileContent, {
            upsert: true,
            contentType: file.metadata.contentType
          });

        if (error) {
          console.error(`Failed to restore file ${file.path}:`, error);
        }
      }
      console.log(`✓ Restored ${files.length} files to ${bucket} bucket`);
    } catch (error) {
      console.error(`Failed to restore ${bucket} bucket:`, error);
      throw error;
    }
  }
}

async function restoreDatabaseData(data: Record<string, any[]>) {
  console.log('\nRestoring database data...');

  // First delete all existing data in reverse dependency order
  console.log('Clearing existing data...');
  for (const table of DELETE_ORDER) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .gte('created_at', '2000-01-01'); // Delete all rows created after year 2000

    if (deleteError) {
      console.warn(`Warning: Could not clear ${table}: ${deleteError.message}`);
    } else {
      console.log(`✓ Cleared ${table}`);
    }
  }

  // Then restore data in correct order
  for (const table of RESTORE_ORDER) {
    const tableData = data[table];
    if (!tableData || tableData.length === 0) {
      console.log(`\nSkipping ${table} - no data to restore`);
      continue;
    }

    console.log(`\nRestoring ${table}...`);
    console.log(`Found ${tableData.length} rows to restore`);

    try {
      // For each table, first try to delete any rows that would conflict
      const ids = tableData.map(row => row.id);
      if (ids.length > 0) {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .in('id', ids);

        if (deleteError) {
          console.warn(`Warning: Could not clear existing rows in ${table}: ${deleteError.message}`);
        }
      }

      // Restore in batches of 50 to avoid timeouts
      const batchSize = 50;
      for (let i = 0; i < tableData.length; i += batchSize) {
        const batch = tableData.slice(i, i + batchSize);
        const { error } = await supabase
          .from(table)
          .insert(batch)
          .select();

        if (error) {
          throw new Error(`Error restoring ${table}: ${error.message}`);
        }

        console.log(`✓ Restored rows ${i + 1} to ${i + batch.length}`);
      }

      console.log(`✅ Completed restoring ${tableData.length} rows to ${table}`);
    } catch (error) {
      throw error;
    }
  }
}

async function restoreAuthData(authData: any) {
  console.log('\nRestoring auth data...');
  
  try {
    // First delete existing users that are not in the backup
    const { data: currentUsers } = await supabase.auth.admin.listUsers();
    const backupUserIds = new Set(authData.users.map((u: any) => u.id));
    
    for (const user of currentUsers.users) {
      if (!backupUserIds.has(user.id)) {
        await supabase.auth.admin.deleteUser(user.id);
      }
    }

    // Create/restore users from backup
    for (const user of authData.users) {
      try {
        // First try to create the user
        const { error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: true,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata,
          password: 'temp123', // Temporary password that user will need to reset
          id: user.id
        });

        if (createError && createError.message !== 'User already registered') {
          console.error(`Failed to create user ${user.email}:`, createError);
          continue;
        }

        // Then update the user with all their metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            email: user.email,
            phone: user.phone,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata,
          }
        );

        if (updateError) {
          console.error(`Failed to update user ${user.email}:`, updateError);
        }
      } catch (error) {
        console.error(`Failed to restore user ${user.email}:`, error);
      }
    }

    console.log(`✓ Restored ${authData.users.length} users`);
  } catch (error) {
    console.error('Failed to restore auth data:', error);
    throw error;
  }
}

async function restoreFullBackup() {
  try {
    const { backupData, backupDir } = await getLatestFullBackup();
    console.log(`Restoring data from backup created at: ${backupData.timestamp}`);

    // Restore all data types
    await restoreAuthData(backupData.auth);
    await restoreStorageData(backupData.storage, backupDir);
    await restoreDatabaseData(backupData.data);

    console.log('\n✅ Full restoration completed successfully');
    console.log('Restored:');
    console.log('- Database data');
    console.log('- Auth data');
    console.log('- Storage files');

  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
}

restoreFullBackup(); 