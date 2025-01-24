import { useState, useEffect } from 'react';
import { Loader2, Download, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getFileUrl } from '@/lib/uploadFiles';
import type { Attachment } from '@/db/types/database';

interface FileViewerProps {
  attachment: Attachment;
  onClose: () => void;
  isOpen: boolean;
}

export function FileViewer({ attachment, onClose, isOpen }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && attachment) {
      loadFile();
    }
  }, [isOpen, attachment]);

  const loadFile = async () => {
    try {
      setLoading(true);
      const url = await getFileUrl(attachment.storage_path);
      setFileUrl(url);
    } catch (error) {
      console.error('Failed to load file:', error);
    } finally {
      setLoading(false);
    }
  };

  const isImage = attachment.content_type.startsWith('image/');
  const isPDF = attachment.content_type === 'application/pdf';
  const isText = attachment.content_type.startsWith('text/') || 
                 ['application/json', 'application/xml'].includes(attachment.content_type);

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{attachment.file_name}</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(fileUrl!, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = fileUrl!;
                  a.download = attachment.file_name;
                  a.click();
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="h-full">
              {isImage && (
                <img
                  src={fileUrl!}
                  alt={attachment.file_name}
                  className="max-w-full h-auto object-contain mx-auto"
                />
              )}
              {isPDF && (
                <iframe
                  src={fileUrl!}
                  className="w-full h-full"
                  title={attachment.file_name}
                />
              )}
              {isText && (
                <iframe
                  src={fileUrl!}
                  className="w-full h-full"
                  title={attachment.file_name}
                />
              )}
              {!isImage && !isPDF && !isText && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500">
                    Preview not available for this file type. Please download to view.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
