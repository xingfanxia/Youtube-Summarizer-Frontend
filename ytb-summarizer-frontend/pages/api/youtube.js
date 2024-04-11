// pages/api/youtube.js
import axios from 'axios';

export default async function handler(req, res) {
  console.log("Query parameters:", req.query);
  const { v: videoId } = req.query;
  console.log("Received videoId:", videoId); // Debugging log

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const response = await axios.post('https://summ.xiax.xyz/youtube_markdown', {
      use_cache: false,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      use_sse: false,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY',
      },
    });

    // Assuming the API returns Markdown text in the response body
    res.status(200).send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}