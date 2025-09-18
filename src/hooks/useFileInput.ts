import { useState, useCallback, useRef } from 'react';

export interface FileInputOptions {
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  onError?: (error: string) => void;
}

export interface FileInputState {
  files: File[];
  isDragOver: boolean;
  isUploading: boolean;
  error: string | null;
  previewUrls: string[];
}

export interface FileInputActions {
  handleFiles: (files: FileList | File[]) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  clearFiles: () => void;
  removeFile: (index: number) => void;
  setUploading: (uploading: boolean) => void;
  setError: (error: string | null) => void;
}

export function useFileInput(options: FileInputOptions = {}): FileInputState & FileInputActions {
  const {
    accept = 'image/*',
    maxSize = 10 * 1024 * 1024, // 10MB default
    multiple = false,
    onError,
  } = options;

  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`;
    }

    // Check file type
    if (accept && accept !== '*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type;
        }
        if (type.includes('*')) {
          const baseType = type.replace('*', '');
          return fileType.startsWith(baseType);
        }
        return fileType === type;
      });

      if (!isAccepted) {
        return `File "${file.name}" is not an accepted file type. Accepted types: ${accept}`;
      }
    }

    return null;
  }, [accept, maxSize]);

  const processFiles = useCallback((newFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of newFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(validationError);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      const errorMessage = errors.join('; ');
      setError(errorMessage);
      onError?.(errorMessage);
    } else {
      setError(null);
    }

    if (validFiles.length > 0) {
      const filesToSet = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(filesToSet);

      // Create preview URLs
      const urls = filesToSet.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => {
        // Clean up old URLs
        prev.forEach(url => URL.revokeObjectURL(url));
        return urls;
      });
    }
  }, [files, multiple, validateFile, onError]);

  const handleFiles = useCallback((fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList);
    processFiles(fileArray);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [processFiles]);

  const clearFiles = useCallback(() => {
    // Clean up preview URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    setFiles([]);
    setPreviewUrls([]);
    setError(null);
    setIsUploading(false);
  }, [previewUrls]);

  const removeFile = useCallback((index: number) => {
    if (index >= 0 && index < files.length) {
      // Clean up the specific preview URL
      URL.revokeObjectURL(previewUrls[index]);
      
      const newFiles = files.filter((_, i) => i !== index);
      const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
      
      setFiles(newFiles);
      setPreviewUrls(newPreviewUrls);
      
      // Clear error if no files left
      if (newFiles.length === 0) {
        setError(null);
      }
    }
  }, [files, previewUrls]);

  const setUploading = useCallback((uploading: boolean) => {
    setIsUploading(uploading);
  }, []);

  const setErrorState = useCallback((error: string | null) => {
    setError(error);
    if (error) {
      onError?.(error);
    }
  }, [onError]);

  return {
    files,
    isDragOver,
    isUploading,
    error,
    previewUrls,
    handleFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearFiles,
    removeFile,
    setUploading,
    setError: setErrorState,
  };
}

export default useFileInput;
