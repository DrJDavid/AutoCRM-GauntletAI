import { supabase } from './supabaseClient';
import type { Attachment } from '@/db/types/database';

/**
 * Uploads files to Supabase storage and creates attachment records
 * @param files - Array of files to upload
 * @param ticketId - ID of the ticket to attach files to
 * @param organizationId - ID of the organization
 * @param userId - ID of the user uploading the files
 * @returns Array of created attachment records
 */
export async function uploadFiles({
  files,
  ticketId,
  organizationId,
  userId,
}: {
  files: File[];
  ticketId: string;
  organizationId: string;
  userId: string;
}): Promise<Attachment[]> {
  const attachments: Attachment[] = [];

  for (const file of files) {
    try {
      // Create a unique file path: org_id/ticket_id/timestamp_filename
      const timestamp = new Date().getTime();
      const filePath = `${organizationId}/${ticketId}/${timestamp}_${file.name}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create attachment record in database
      const { data: attachment, error: dbError } = await supabase
        .from('attachments')
        .insert({
          file_name: file.name,
          file_size: file.size,
          content_type: file.type,
          storage_path: filePath,
          ticket_id: ticketId,
          uploaded_by: userId,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      if (attachment) attachments.push(attachment);
    } catch (error) {
      console.error('Error uploading file:', file.name, error);
      // Continue with other files even if one fails
      continue;
    }
  }

  return attachments;
}

/**
 * Deletes files from Supabase storage and removes attachment records
 * @param attachments - Array of attachment records to delete
 */
export async function deleteFiles(attachments: Attachment[]): Promise<void> {
  for (const attachment of attachments) {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('ticket-attachments')
        .remove([attachment.storage_path]);

      if (storageError) throw storageError;

      // Delete attachment record
      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;
    } catch (error) {
      console.error('Error deleting file:', attachment.file_name, error);
      // Continue with other files even if one fails
      continue;
    }
  }
}

/**
 * Gets a temporary URL for downloading a file
 * @param storagePath - Path to the file in storage
 * @returns URL for downloading the file
 */
export async function getFileUrl(storagePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .createSignedUrl(storagePath, 3600); // URL valid for 1 hour

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
}
