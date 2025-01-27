import { FileIcon, ExternalLink } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

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
  // Function to determine if the file is an image
  const isImage = (contentType: string) => {
    return contentType.startsWith('image/');
  };

  // Function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          {isImage(file.content_type) ? (
            <div className="relative aspect-video">
              <img
                src={file.storage_path}
                alt={file.file_name}
                className="absolute inset-0 w-full h-full object-cover rounded-md"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center aspect-video bg-gray-100 rounded-md">
              <FileIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
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
  );
}
