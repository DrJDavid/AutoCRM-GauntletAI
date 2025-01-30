import { FC, useState, useEffect, useRef } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabaseClient';
import { FileUpload } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatFileSize } from '@/lib/utils';
import { File, X } from 'lucide-react';
import type { DbTicketAttachment } from '@/types/database';

interface TicketFilesProps {
  ticketId: string;
  mode: 'admin' | 'agent' | 'customer';
  canUpload: boolean;
}

const STORAGE_BUCKET = 'ticket-attachments';

export const TicketFiles: FC<TicketFilesProps> = ({
  ticketId,
  mode,
  canUpload,
}) => {
  const { currentUser } = useUserStore();
  const [files, setFiles] = useState<DbTicketAttachment[]>([]);
  const [selectedFile, setSelectedFile] = useState<DbTicketAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();

  useEffect(() => {
    fetchFiles();
    setupRealtimeSubscription();
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [ticketId]);

  const setupRealtimeSubscription = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`ticket-files-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_attachments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newFile } = await supabase
              .from('ticket_attachments')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (newFile) {
              setFiles(prev => [...prev, newFile]);
            }
          } else if (payload.eventType === 'DELETE') {
            setFiles(prev => prev.filter(f => f.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to file updates');
        }
      });
  };

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (uploadedFiles: File[]) => {
    if (!currentUser) return;

    setIsUploading(true);
    try {
      for (const file of uploadedFiles) {
        console.log('Attempting to upload file:', {
          name: file.name,
          type: file.type,
          size: file.size,
          bucket: STORAGE_BUCKET
        });

        // Upload file to Supabase Storage
        const fileName = `${ticketId}/${Date.now()}-${file.name}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (storageError) {
          console.error('Storage error:', storageError);
          throw storageError;
        }

        console.log('File uploaded successfully:', storageData);

        // Create attachment record
        const { data: attachmentData, error: attachmentError } = await supabase
          .from('ticket_attachments')
          .insert({
            ticket_id: ticketId,
            uploader_id: currentUser.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: fileName,
          })
          .select()
          .single();

        if (attachmentError) {
          console.error('Database error:', attachmentError);
          // If DB insert fails, try to clean up the uploaded file
          await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([fileName]);
          throw attachmentError;
        }

        console.log('Attachment record created:', attachmentData);
      }

      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${uploadedFiles.length} file(s)`
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      if (error instanceof Error) {
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase error object
        const supabaseError = error as { message?: string, statusText?: string };
        toast({
          title: "Upload Failed",
          description: supabaseError.message || supabaseError.statusText || "Failed to upload file",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Upload Failed",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (file: DbTicketAttachment) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error: dbError } = await supabase
        .from('ticket_attachments')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast({
        title: "File Deleted",
        description: "File has been removed"
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const handleFileView = async (file: DbTicketAttachment) => {
    try {
      const { data } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error viewing file:', error);
      toast({
        title: "Error",
        description: "Failed to open file",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="border-2 border-dashed rounded-lg p-4">
          <FileUpload
            onUpload={handleFileUpload}
            isUploading={isUploading}
            accept={{
              'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
              'text/plain': ['.txt'],
              'application/zip': ['.zip']
            }}
            maxSize={10 * 1024 * 1024} // 10MB
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center space-x-4">
              <File className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium truncate max-w-[200px]">
                  {file.file_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(file.file_size)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFileView(file)}
              >
                View
              </Button>
              {(mode === 'admin' || file.uploader_id === currentUser?.id) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileDelete(file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedFile.file_name}</DialogTitle>
              <DialogDescription>
                {formatFileSize(selectedFile.file_size)}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {selectedFile.file_type.startsWith('image/') ? (
                <img
                  src={`${supabase.storage.from('ticket-attachments').getPublicUrl(selectedFile.storage_path).data.publicUrl}`}
                  alt={selectedFile.file_name}
                  className="max-h-[600px] mx-auto"
                />
              ) : (
                <div className="text-center py-8">
                  <File className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                  <p>This file type cannot be previewed</p>
                  <Button
                    className="mt-4"
                    onClick={() => handleFileView(selectedFile)}
                  >
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 