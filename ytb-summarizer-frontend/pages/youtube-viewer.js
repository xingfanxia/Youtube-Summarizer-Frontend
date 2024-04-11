import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { marked } from 'marked';

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
        // Process any remaining buffer
        if (buffer) {
          setContent((prevContent) => prevContent + marked(buffer));
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

        // Update content with the complete segment
        setContent((prevContent) => prevContent + marked(completeSegment));
      }

      readStream(); // Read the next chunk
    }

    readStream();
  }

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}