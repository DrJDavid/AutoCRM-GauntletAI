import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';

interface FileUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  accept?: string;
}

export function FileUpload({
  onUploadComplete,
  maxFiles = 5,
  accept = '*'
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length <= maxFiles) {
        setFiles([...files, ...newFiles]);
        setProgress([...progress, ...new Array(newFiles.length).fill(0)]);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setProgress(progress.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    const uploadPromises = files.map(async (file, index) => {
      const fileName = `${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('ticket-attachments')
        .upload(fileName, file, {
          onUploadProgress: (event) => {
            const percent = (event.loaded / (event.total || 0)) * 100;
            setProgress(prev => 
              prev.map((p, i) => i === index ? percent : p)
            );
          }
        });

      if (error) throw error;
      return data.path;
    });

    try {
      const urls = await Promise.all(uploadPromises);
      onUploadComplete(urls);
      setFiles([]);
      setProgress([]);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={files.length >= maxFiles}
        >
          <Upload className="mr-2 h-4 w-4" />
          Select Files
        </Button>
        {files.length > 0 && (
          <Button onClick={uploadFiles}>
            Upload {files.length} file{files.length !== 1 ? 's' : ''}
          </Button>
        )}
      </div>

      <input
        id="file-upload"
        type="file"
        className="hidden"
        multiple
        accept={accept}
        onChange={handleFileSelect}
      />

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-2 border rounded"
            >
              <span className="flex-1 truncate">{file.name}</span>
              <Progress value={progress[index]} className="w-24" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
