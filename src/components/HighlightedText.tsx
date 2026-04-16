import React from 'react';

interface HighlightedTextProps {
  text: string;
  query: string;
}

export default function HighlightedText({ text, query }: HighlightedTextProps) {
  if (!query.trim()) return <>{text}</>;

  // Tokenize query similar to searchEngine but for highlighting
  const tokens = query.split(/\s+/)
    .filter(t => t.length > 1 && !['AND', 'OR', 'NOT'].includes(t.toUpperCase()))
    .map(t => t.startsWith('-') ? t.substring(1) : t)
    .filter(t => t.length > 0);

  if (tokens.length === 0) return <>{text}</>;

  // Create regex pattern to match any of the tokens (case-insensitive, ignoring accents)
  // To ignore accents in highlighting, we can normalize both text and tokens
  // or use a simpler approach for now: match the actual tokens found in query.
  
  const escapedTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escapedTokens.join('|')})`, 'gi');

  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => 
        pattern.test(part) ? (
          <mark key={index} className="highlight-match">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
