import React from 'react';
import { Server, Code, Download, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { MCPServer } from '../types';

interface ServerOverviewProps {
  server: MCPServer;
  onViewCode: () => void;
  onDownload: () => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

export const ServerOverview: React.FC<ServerOverviewProps> = ({
  server,
  onViewCode,
  onDownload,
  expanded = false,
  onToggleExpanded
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-emerald-600 bg-emerald-100';
      case 'generating': return 'text-amber-600 bg-amber-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'generating': return 'Generating...';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{server.name}</h3>
              <p className="text-gray-600 mt-1">{server.description}</p>
            </div>
          </div>
          
          <div className={`
            px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2
            ${getStatusColor(server.status)}
          `}>
            {server.status === 'generating' && (
              <div className="w-3 h-3 border border-amber-600 border-t-transparent rounded-full animate-spin" />
            )}
            <span>{getStatusText(server.status)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {server.endpoints.length} endpoint{server.endpoints.length !== 1 ? 's' : ''} available
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onViewCode}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <Code className="w-4 h-4" />
              <span>View Code</span>
            </button>
            
            <button
              onClick={onDownload}
              disabled={server.status !== 'ready'}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            {onToggleExpanded && (
              <button
                onClick={onToggleExpanded}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{expanded ? 'Hide' : 'Show'} Endpoints</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Available Endpoints</h4>
            <div className="space-y-3">
              {server.endpoints.map((endpoint) => (
                <div key={endpoint.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`
                        px-2 py-1 text-xs font-medium rounded
                        ${endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                          endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                          endpoint.method === 'PUT' ? 'bg-amber-100 text-amber-800' :
                          endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{endpoint.path}</code>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{endpoint.description}</p>
                  {endpoint.parameters.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Parameters: {endpoint.parameters.map(p => p.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
