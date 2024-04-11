import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { unified } from 'unified';
import markdown from 'remark-parse';
import gfm from 'remark-gfm';
import remark2rehype from 'remark-rehype';
import stringify from 'rehype-stringify';
import 'github-markdown-css';

export default function YoutubeViewer() {
  const [content, setContent] = useState('');
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
        if (buffer) {
          // Process any remaining buffer
          processMarkdown(buffer).then(html => {
            setContent((prevContent) => prevContent + html);
          });
        }
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

        // Process and update content with the complete segment
        processMarkdown(completeSegment).then(html => {
          setContent((prevContent) => prevContent + html);
        });
      }

      readStream(); // Read the next chunk
    }

    readStream();
  }

  // Process and display the Markdown content
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

  return (
    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: content }} />
  );
}