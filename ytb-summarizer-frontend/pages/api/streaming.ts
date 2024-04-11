// pages/api/streaming.js
import { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';

export default (req: NextApiRequest, res: NextApiResponse) => {
  const { v: videoId } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  // Prepare the request options for the external SSE source
  const options = {
    hostname: 'summ.xiax.xyz',
    port: 443,
    path: '/youtube_markdown',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer API_KEY', // Ensure this is secure and not exposed in client-side code
      'Accept': 'text/event-stream', // Expecting an SSE response
    },
  };
  // Make an HTTPS request to the external service
  const reqStream = https.request(options, (stream) => {
    stream.on('data', (chunk) => {
      // Forward each chunk of data (SSE event) to the client
    //   console.log('Received chunk:', chunk.toString());
    //   chunk.pipe(res);
      res.write(chunk);
    });

    stream.on('end', () => {
      res.end();
    });
  });

  reqStream.on('error', (error) => {
    console.error('Request failed:', error);
    res.status(500).json({ error: 'Failed to connect to external SSE source' });
  });

  // Send the request with the payload
  reqStream.write(JSON.stringify({
    "use_cache": false,
    "url": `https://www.youtube.com/watch?v=${videoId}`,
    "use_sse": false // Assuming this indicates you want an SSE response
  }));

  reqStream.end();
};