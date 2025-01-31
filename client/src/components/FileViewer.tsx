import { FileIcon, ExternalLink } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';

interface FileViewerProps {
  file: {
    id: string;
    file_name: string;
    storage_path: string;
    content_type: string;
    file_size: number;
  };
}

export function FileViewer({ file }: FileViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Function to determine file type
  const getFileType = (contentType: string, fileName: string) => {
    if (contentType.startsWith('image/')) return 'image';
    if (contentType === 'application/pdf') return 'pdf';
    if (contentType === 'text/plain' || fileName.endsWith('.txt')) return 'text';
    if (contentType === 'text/html' || fileName.endsWith('.html')) return 'html';
    if (contentType.includes('video/')) return 'video';
    return 'other';
  };

  // Function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileType = getFileType(file.content_type, file.file_name);

  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <img
            src={file.storage_path}
            alt={file.file_name}
            className="w-full h-full object-contain rounded-md"
            onClick={() => setIsOpen(true)}
          />
        );
      case 'pdf':
        return (
          <iframe
            src={`${file.storage_path}#view=FitH`}
            className="w-full h-full rounded-md"
            title={file.file_name}
          />
        );
      case 'video':
        return (
          <video
            src={file.storage_path}
            controls
            className="w-full h-full rounded-md"
          >
            Your browser does not support the video tag.
          </video>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <FileIcon className="w-12 h-12 text-gray-400" />
          </div>
        );
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <div className="relative aspect-video bg-gray-50">
              {renderPreview()}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium truncate" title={file.file_name}>
                  {file.file_name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(file.file_size)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(file.storage_path, '_blank')}
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full screen image viewer */}
      {fileType === 'image' && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-screen-lg h-[90vh]">
            <div className="relative w-full h-full">
              <img
                src={file.storage_path}
                alt={file.file_name}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
