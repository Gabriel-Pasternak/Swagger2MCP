import { useState, useCallback } from 'react';
import { SwaggerSpec, MCPServer } from '../types';
import { SwaggerParser } from '../utils/swaggerParser';

export const useSwaggerToMCP = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [server, setServer] = useState<MCPServer | null>(null);

  const processSwaggerFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse the Swagger file
      const spec: SwaggerSpec = await SwaggerParser.parseFile(file);
      
      // Generate MCP server
      const mcpServer = SwaggerParser.generateMCPServer(spec);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark as ready
      mcpServer.status = 'ready';
      setServer(mcpServer);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process Swagger file';
      setError(errorMessage);
      
      if (server) {
        setServer({ ...server, status: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [server]);

  const resetServer = useCallback(() => {
    setServer(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    server,
    isLoading,
    error,
    processSwaggerFile,
    resetServer
  };
};