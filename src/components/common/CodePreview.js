'use client';

import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';

SyntaxHighlighter.registerLanguage('java', java);

export default function CodePreview({ language = 'java', value }) {
  return (
    <div className="preview-code">
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 12,
          background: 'var(--surface-soft)'
        }}
        showLineNumbers
        wrapLongLines
      >
        {value ?? ''}
      </SyntaxHighlighter>
    </div>
  );
}

