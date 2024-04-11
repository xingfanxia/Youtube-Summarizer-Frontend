// pages/youtube-viewer.js
import { useState } from 'react';
import axios from 'axios';
import { marked } from 'marked';

export default function YoutubeViewer() {
  const [videoId, setVideoId] = useState('');
  const [content, setContent] = useState('');\
  const router = useRouter();

  useEffect(() => {
    if (router.query.v) {
      setVideoId(router.query.v);
      fetchMarkdown(router.query.v);
    }
  }, [router.query.v]);
  
  const fetchMarkdown = async () => {
    console.log(`Requesting videoId: ${videoId}`);
    const response = await axios.get(`/api/youtube?v=${videoId}`);
    setContent(marked(response.data));
  };

  return (
    <div>
      <input
        type="text"
        value={videoId}
        onChange={(e) => {
            console.log(e.target.value); // Add this line for debugging
            setVideoId(e.target.value);
        }}
        placeholder="Enter YouTube Video ID"
      />
      <button onClick={fetchMarkdown}>Fetch</button>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}