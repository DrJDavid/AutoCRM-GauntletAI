import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface FileUploadProps {
  /**
   * Maximum number of files that can be uploaded at once
   * @default 5
   */
  maxFiles?: number;
  /**
   * Maximum size of each file in bytes
   * @default 5242880 (5MB)
   */
  maxSize?: number;
  /**
   * Allowed file types
   * @default ['image/*', 'application/pdf']
   */
  accept?: Record<string, string[]>;
  /**
   * Callback when files are added or removed
   */
  onChange?: (files: File[]) => void;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether the upload is disabled
   */
  disabled?: boolean;
}

export function FileUpload({
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/pdf': ['.pdf'],
  },
  onChange,
  className,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
      setFiles(newFiles);
      onChange?.(newFiles);
    },
    [files, maxFiles, onChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      onChange?.(newFiles);
    },
    [files, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - files.length,
    maxSize,
    accept,
    disabled,
  });

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <>
              <p className="text-sm">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-xs text-muted-foreground">
                {Object.entries(accept)
                  .map(([type, exts]) =>
                    type.startsWith('image/')
                      ? 'Images'
                      : exts.map((ext) => ext.replace('.', '').toUpperCase())
                  )
                  .flat()
                  .join(', ')}
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB
                each
              </p>
            </>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50"
            >
              <File className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 truncate" title={file.name}>
                {file.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)}KB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
