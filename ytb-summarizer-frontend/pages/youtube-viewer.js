import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { unified } from 'unified';
import markdown from 'remark-parse';
import gfm from 'remark-gfm';
import remark2rehype from 'remark-rehype';
import stringify from 'rehype-stringify';
import 'github-markdown-css';

export default function YoutubeViewer() {
  const [content, setContent] = useState('');
  const rawMarkdownRef = useRef(''); // Ref to store raw markdown
  const router = useRouter();

  useEffect(() => {
    if (router.query.v) {
      fetchAndDisplayMarkdown(router.query.v);
    }
  }, [router.query.v]);

  async function fetchAndDisplayMarkdown(videoId) {
    const response = await fetch(`/api/streaming?v=${videoId}`);
    const reader = response.body.getReader();
    let buffer = '';

    async function readStream() {
      const { done, value } = await reader.read();
      if (done) {
        console.log('Stream finished.');
        return;
      }

      const chunkText = new TextDecoder("utf-8").decode(value);
      buffer += chunkText;

      // Check if we have a complete Markdown block
      const lastNewLineIndex = buffer.lastIndexOf('\n\n');
      if (lastNewLineIndex !== -1) {
        // Everything up to the last '\n\n' is considered complete
        const completeSegment = buffer.substring(0, lastNewLineIndex + 2);
        // The rest is kept in the buffer for the next chunk
        buffer = buffer.substring(lastNewLineIndex + 2);

        // Update rawMarkdownRef with the complete segment
        rawMarkdownRef.current += completeSegment;

        // Process and update content with the complete segment
        processMarkdown(completeSegment).then(html => {
          setContent((prevContent) => prevContent + html);
        });
      }

      readStream(); // Read the next chunk
    }

    readStream();
  }

  async function processMarkdown(markdownText) {
    try {
      const file = await unified()
        .use(markdown)
        .use(gfm)
        .use(remark2rehype)
        .use(stringify)
        .process(markdownText);
      return String(file);
    } catch (error) {
      console.error('Error processing markdown:', error);
      return '';
    }
  }

  const copyToClipboard = () => {
    // Copy the raw markdown text from the ref
    navigator.clipboard.writeText(rawMarkdownRef.current).then(() => {
      alert('Markdown text copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
        <h1 style={{ textAlign: 'center' }}>Video Summary</h1>
        <div className="markdown-body" style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '5px' }} dangerouslySetInnerHTML={{ __html: content }} />
        <button onClick={copyToClipboard} style={{ display: 'block', margin: '20px auto', padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>Copy Markdown</button>
    </div>
  );
}