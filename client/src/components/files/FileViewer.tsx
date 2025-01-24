import { useState, useEffect } from 'react';
import { Loader2, Download, ExternalLink, X, FileText, Image as ImageIcon, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getFileUrl } from '@/lib/uploadFiles';
import { formatFileSize } from '@/lib/utils';
import type { Attachment } from '@/db/types/database';

interface FileViewerProps {
  attachment: Attachment;
  onClose: () => void;
}

export function FileViewer({ attachment, onClose }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (attachment) {
      loadFile();
    }
  }, [attachment]);

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = await getFileUrl(attachment.storage_path);
      setFileUrl(url);
    } catch (error) {
      console.error('Failed to load file:', error);
      setError('Failed to load file. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const isImage = attachment.content_type.startsWith('image/');
  const isPDF = attachment.content_type === 'application/pdf';
  const isText = attachment.content_type.startsWith('text/') || 
                 ['application/json', 'application/xml', 'application/javascript', 'text/typescript'].includes(attachment.content_type);
  const isVideo = attachment.content_type.startsWith('video/');
  const isAudio = attachment.content_type.startsWith('audio/');

  const FileIcon = isImage ? ImageIcon : isText ? FileCode : FileText;

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileIcon className="h-5 w-5 text-muted-foreground" />
              <DialogTitle className="text-xl">{attachment.file_name}</DialogTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(fileUrl!, '_blank')}
                title="Open in new tab"
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
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{attachment.content_type}</span>
            <span>{formatFileSize(attachment.file_size)}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 rounded-md">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-destructive">
              {error}
            </div>
          ) : (
            <div className="h-full p-4">
              {isImage && (
                <img
                  src={fileUrl!}
                  alt={attachment.file_name}
                  className="max-w-full h-auto object-contain mx-auto rounded-md shadow-sm"
                />
              )}
              {isPDF && (
                <iframe
                  src={fileUrl!}
                  className="w-full h-full rounded-md"
                  title={attachment.file_name}
                />
              )}
              {isText && (
                <iframe
                  src={fileUrl!}
                  className="w-full h-full bg-white rounded-md"
                  title={attachment.file_name}
                />
              )}
              {isVideo && (
                <video
                  src={fileUrl!}
                  controls
                  className="w-full h-full rounded-md"
                  title={attachment.file_name}
                >
                  Your browser does not support the video tag.
                </video>
              )}
              {isAudio && (
                <audio
                  src={fileUrl!}
                  controls
                  className="w-full mt-8"
                  title={attachment.file_name}
                >
                  Your browser does not support the audio tag.
                </audio>
              )}
              {!isImage && !isPDF && !isText && !isVideo && !isAudio && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <FileIcon className="h-16 w-16 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Preview not available. Click the download button to view this file.
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
