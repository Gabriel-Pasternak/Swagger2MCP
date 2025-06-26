import React from 'react';
import { Code, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

interface MessageContentRendererProps {
  content: string;
}

export const MessageContentRenderer: React.FC<MessageContentRendererProps> = ({ content }) => {
  const renderContent = (text: string) => {
    // Split content into lines for processing
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Handle code blocks (```language or just ```)
      if (line.trim().startsWith('```')) {
        const language = line.trim().slice(3).trim();
        const codeLines: string[] = [];
        i++;
        
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        const codeContent = codeLines.join('\n');
        
        // Try to parse as JSON for better formatting
        let formattedCode = codeContent;
        let isJson = false;
        
        if (language === 'json' || (!language && codeContent.trim().startsWith('{') || codeContent.trim().startsWith('['))) {
          try {
            const parsed = JSON.parse(codeContent.trim());
            formattedCode = JSON.stringify(parsed, null, 2);
            isJson = true;
          } catch {
            // Keep original if not valid JSON
          }
        }

        elements.push(
          <div key={`code-${elements.length}`} className="my-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Code className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {isJson ? 'JSON Response' : language || 'Code'}
                  </span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(formattedCode)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  Copy
                </button>
              </div>
              <pre className="p-4 text-sm overflow-x-auto">
                <code className={isJson ? 'text-gray-800' : 'text-gray-700'}>
                  {formattedCode}
                </code>
              </pre>
            </div>
          </div>
        );
        i++;
        continue;
      }

      // Handle inline code (`code`)
      if (line.includes('`') && !line.trim().startsWith('```')) {
        const parts = line.split('`');
        const lineElements: React.ReactNode[] = [];
        
        parts.forEach((part, index) => {
          if (index % 2 === 0) {
            // Regular text - process for other formatting
            lineElements.push(renderInlineFormatting(part, `text-${elements.length}-${index}`));
          } else {
            // Code part
            lineElements.push(
              <code key={`code-${elements.length}-${index}`} className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                {part}
              </code>
            );
          }
        });
        
        elements.push(
          <p key={`line-${elements.length}`} className="my-2 leading-relaxed">
            {lineElements}
          </p>
        );
        i++;
        continue;
      }

      // Handle headers (### Header)
      if (line.trim().match(/^#{1,6}\s/)) {
        const level = line.match(/^(#{1,6})/)?.[1].length || 1;
        const text = line.replace(/^#{1,6}\s*/, '');
        const HeaderTag = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements; // h3-h6
        
        elements.push(
          <HeaderTag key={`header-${elements.length}`} className={`
            font-semibold text-gray-900 mt-6 mb-3
            ${level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base'}
          `}>
            {text}
          </HeaderTag>
        );
        i++;
        continue;
      }

      // Handle lists (- item or 1. item)
      if (line.trim().match(/^[-*]\s/) || line.trim().match(/^\d+\.\s/)) {
        const listItems: string[] = [];
        const isOrdered = line.trim().match(/^\d+\.\s/);
        
        while (i < lines.length && (lines[i].trim().match(/^[-*]\s/) || lines[i].trim().match(/^\d+\.\s/) || lines[i].trim() === '')) {
          if (lines[i].trim() !== '') {
            const itemText = lines[i].replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '');
            listItems.push(itemText);
          }
          i++;
        }
        
        const ListTag = isOrdered ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${elements.length}`} className={`my-4 ${isOrdered ? 'list-decimal' : 'list-disc'} list-inside space-y-1`}>
            {listItems.map((item, index) => (
              <li key={index} className="text-gray-800 leading-relaxed">
                {renderInlineFormatting(item, `list-item-${elements.length}-${index}`)}
              </li>
            ))}
          </ListTag>
        );
        continue;
      }

      // Handle alerts/callouts
      if (line.trim().match(/^(⚠️|🚨|ℹ️|💡|✅|❌)/)) {
        const icon = line.trim().match(/^(⚠️|🚨|ℹ️|💡|✅|❌)/)?.[1];
        const text = line.replace(/^(⚠️|🚨|ℹ️|💡|✅|❌)\s*/, '');
        
        let alertClass = 'bg-blue-50 border-blue-200 text-blue-800';
        let AlertIcon = Info;
        
        if (icon === '⚠️' || icon === '🚨') {
          alertClass = 'bg-amber-50 border-amber-200 text-amber-800';
          AlertIcon = AlertTriangle;
        } else if (icon === '✅') {
          alertClass = 'bg-green-50 border-green-200 text-green-800';
          AlertIcon = CheckCircle2;
        } else if (icon === '❌') {
          alertClass = 'bg-red-50 border-red-200 text-red-800';
          AlertIcon = XCircle;
        }
        
        elements.push(
          <div key={`alert-${elements.length}`} className={`my-4 p-4 border rounded-lg ${alertClass}`}>
            <div className="flex items-start space-x-3">
              <AlertIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">
                {renderInlineFormatting(text, `alert-text-${elements.length}`)}
              </div>
            </div>
          </div>
        );
        i++;
        continue;
      }

      // Handle regular paragraphs
      if (line.trim() !== '') {
        elements.push(
          <p key={`para-${elements.length}`} className="my-2 text-gray-800 leading-relaxed">
            {renderInlineFormatting(line, `para-${elements.length}`)}
          </p>
        );
      } else {
        // Empty line - add spacing
        elements.push(<div key={`space-${elements.length}`} className="my-2" />);
      }
      
      i++;
    }

    return elements;
  };

  const renderInlineFormatting = (text: string, key: string) => {
    const elements: React.ReactNode[] = [];
    let currentText = text;
    let elementIndex = 0;

    // Handle bold text (**text**)
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = currentText.split(boldRegex);
    
    parts.forEach((part, index) => {
      if (index % 2 === 0) {
        // Regular text - check for links and other formatting
        if (part.includes('http')) {
          const linkRegex = /(https?:\/\/[^\s]+)/g;
          const linkParts = part.split(linkRegex);
          
          linkParts.forEach((linkPart, linkIndex) => {
            if (linkPart.match(linkRegex)) {
              elements.push(
                <a 
                  key={`${key}-link-${elementIndex++}`}
                  href={linkPart}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline inline-flex items-center space-x-1"
                >
                  <span>{linkPart}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              );
            } else if (linkPart) {
              elements.push(<span key={`${key}-text-${elementIndex++}`}>{linkPart}</span>);
            }
          });
        } else if (part) {
          elements.push(<span key={`${key}-text-${elementIndex++}`}>{part}</span>);
        }
      } else {
        // Bold text
        elements.push(
          <strong key={`${key}-bold-${elementIndex++}`} className="font-semibold text-gray-900">
            {part}
          </strong>
        );
      }
    });

    return elements;
  };

  return <div className="prose prose-sm max-w-none">{renderContent(content)}</div>;
};