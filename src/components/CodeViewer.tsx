import React from 'react';
import { X, Copy, Download } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface CodeViewerProps {
  code: string;
  language?: string;
  title: string;
  onClose: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'javascript',
  title,
  onClose,
  onCopy,
  onDownload
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    if (onCopy) onCopy();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-6">
          <div className="h-full border border-gray-200 rounded-lg overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              theme="vs-light"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};