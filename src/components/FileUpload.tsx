import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  error?: string;
  success?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  isLoading = false,
  error,
  success = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${isLoading ? 'pointer-events-none opacity-50' : 'hover:border-blue-400 hover:bg-blue-50'}
          ${success ? 'border-emerald-500 bg-emerald-50' : ''}
          ${error ? 'border-red-500 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full transition-colors duration-200
            ${success ? 'bg-emerald-100 text-emerald-600' : 
              error ? 'bg-red-100 text-red-600' : 
              'bg-blue-100 text-blue-600'}
          `}>
            {isLoading ? (
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
            ) : success ? (
              <CheckCircle className="w-8 h-8" />
            ) : error ? (
              <AlertCircle className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {success ? 'File uploaded successfully!' : 
               error ? 'Upload failed' : 
               'Upload Swagger/OpenAPI File'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isLoading ? 'Processing your file...' :
               success ? 'Your MCP server is being generated' :
               error ? error :
               'Drag and drop your Swagger/OpenAPI file here, or click to browse'}
            </p>
            
            {!success && !error && (
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>JSON</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>YAML</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {!success && !isLoading && (
          <button
            type="button"
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Choose File
          </button>
        )}
      </div>
    </div>
  );
};