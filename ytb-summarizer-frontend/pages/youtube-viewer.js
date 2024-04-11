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
    const [videoUrl, setVideoUrl] = useState('');
    const rawMarkdownRef = useRef('');
    const router = useRouter();
    const [inputUrl, setInputUrl] = useState('');
  
    useEffect(() => {
      if (router.query.v) {
        const url = `https://www.youtube.com/watch?v=${router.query.v}`;
        setVideoUrl(url); // Set the video URL as soon as we know the video ID
        // Initialize content with the summary prefix immediately after setting the video URL
        const summaryPrefix = `> This is a summary of youtube video: ${url}\n\n`;
        setContent(summaryPrefix);
        fetchAndDisplayMarkdown(router.query.v);
      }
    }, [router.query.v]);
  

  const fetchAndDisplayMarkdown = async (videoId) => {
    // Reset content and rawMarkdownRef before fetching new data
    rawMarkdownRef.current = ''; // Clear previous raw markdown

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
  
      const lastNewLineIndex = buffer.lastIndexOf('\n\n');
      if (lastNewLineIndex !== -1) {
        const completeSegment = buffer.substring(0, lastNewLineIndex + 2);
        buffer = buffer.substring(lastNewLineIndex + 2);
  
        rawMarkdownRef.current += completeSegment;
  
        processMarkdown(completeSegment).then(html => {
          setContent((prevContent) => prevContent + html);
        });
      }
  
      readStream();
    }
  
    readStream();
  };

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
    navigator.clipboard.writeText(rawMarkdownRef.current).then(() => {
      alert('Markdown text copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const handleUrlChange = (e) => {
    setInputUrl(e.target.value);
  };

  const handleSubmit = () => {
    const videoId = new URLSearchParams(new URL(inputUrl).search).get('v');
    if (videoId) {
      router.push(`/youtube-viewer?v=${videoId}`); // This will trigger the useEffect and accordingly set the videoUrl and content
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
        <h1 style={{ textAlign: 'center' }}>Video Summary</h1>
        {videoUrl && <iframe width="100%" height="315" src={`https://www.youtube.com/embed/${router.query.v}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <input type="text" value={inputUrl} onChange={handleUrlChange} placeholder="Enter YouTube video URL" style={{ padding: '10px', width: '60%', marginRight: '10px' }} />
          <button onClick={handleSubmit} style={{ padding: '10px 20px' }}>Get Summary</button>
        </div>
        <div className="markdown-body" style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '5px' }} dangerouslySetInnerHTML={{ __html: content }} />
        <button onClick={copyToClipboard} style={{ display: 'block', margin: '20px auto', padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>Copy Markdown</button>
    </div>
  );
}