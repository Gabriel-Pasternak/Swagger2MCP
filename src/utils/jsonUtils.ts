/**
 * Utility functions for parsing JSON from AI responses that may be wrapped in markdown
 */

export class JsonUtils {
    /**
     * Safely parse JSON from AI responses that might be wrapped in markdown code blocks
     * @param content The raw content from AI response
     * @returns Parsed JSON object or null if parsing fails
     */
    static parseAIResponse(content: string): any | null {
      if (!content || typeof content !== 'string') {
        return null;
      }
  
      // Remove any leading/trailing whitespace
      let cleanContent = content.trim();
  
      // Check if content is wrapped in markdown code blocks
      const codeBlockRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
      const match = cleanContent.match(codeBlockRegex);
      
      if (match) {
        cleanContent = match[1].trim();
      }
  
      // Remove any remaining markdown artifacts
      cleanContent = cleanContent
        .replace(/^```json\s*/g, '')
        .replace(/^```\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim();
  
      // Try to parse the cleaned content
      try {
        return JSON.parse(cleanContent);
      } catch (error) {
        console.warn('Failed to parse JSON from AI response:', {
          originalContent: content,
          cleanedContent: cleanContent,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        return null;
      }
    }
  
    /**
     * Extract JSON from mixed content (text + JSON)
     * @param content Mixed content that might contain JSON
     * @returns Parsed JSON object or null
     */
    static extractJsonFromMixedContent(content: string): any | null {
      if (!content) return null;
  
      // Look for JSON objects in the content
      const jsonRegex = /\{[\s\S]*\}/;
      const match = content.match(jsonRegex);
      
      if (match) {
        return this.parseAIResponse(match[0]);
      }
  
      return null;
    }
  
    /**
     * Validate if a parsed object has required properties
     * @param obj The parsed object
     * @param requiredProps Array of required property names
     * @returns boolean indicating if all required props exist
     */
    static hasRequiredProperties(obj: any, requiredProps: string[]): boolean {
      if (!obj || typeof obj !== 'object') {
        return false;
      }
  
      return requiredProps.every(prop => obj.hasOwnProperty(prop));
    }
  
    /**
     * Safe JSON stringify with error handling
     * @param obj Object to stringify
     * @param space Spacing for formatting
     * @returns Stringified JSON or error message
     */
    static safeStringify(obj: any, space?: number): string {
      try {
        return JSON.stringify(obj, null, space);
      } catch (error) {
        return `[Error stringifying object: ${error instanceof Error ? error.message : 'Unknown error'}]`;
      }
    }
  }