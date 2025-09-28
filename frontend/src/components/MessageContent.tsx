import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MessageContentProps {
  content: string;
  role: 'user' | 'assistant';
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, role }) => {
  return (
    <div className="text-sm">
      <ReactMarkdown 
        components={{
        // Custom styles for different markdown elements
        p: ({ children }) => (
          <p className="mb-2 last:mb-0">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="ml-2">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className={`border-l-3 pl-3 my-2 ${
            role === 'assistant' ? 'border-gray-400 text-gray-700' : 'border-indigo-400 text-indigo-100'
          }`}>
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className={`px-1 py-0.5 rounded text-xs ${
            role === 'assistant' ? 'bg-gray-100 text-gray-800' : 'bg-indigo-500 text-indigo-100'
          }`}>
            {children}
          </code>
        ),
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mb-1">{children}</h3>
        ),
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`underline ${
              role === 'assistant' ? 'text-blue-600 hover:text-blue-800' : 'text-indigo-200 hover:text-indigo-100'
            }`}
          >
            {children}
          </a>
        ),
        hr: () => (
          <hr className={`my-3 ${
            role === 'assistant' ? 'border-gray-300' : 'border-indigo-400'
          }`} />
        )
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};