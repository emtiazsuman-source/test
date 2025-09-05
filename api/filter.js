// This file will act as our serverless function on Vercel
import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API keys from environment variables
// Vercel will make these available at runtime
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  // Add more keys here
  process.env.GEMINI_API_KEY_20,
].filter(key => key); // Filter out any undefined keys

let keyIndex = 0; // Index for round-robin key selection

// Vercel serverless function handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, imageData } = req.body;

  if (!prompt || !imageData) {
    return res.status(400).json({ error: 'Prompt and image data are required.' });
  }

  if (API_KEYS.length === 0) {
    return res.status(500).json({ error: 'No API keys are configured.' });
  }
  
  // Try each key in a round-robin fashion until one succeeds
  for (let i = 0; i < API_KEYS.length; i++) {
    const currentKey = API_KEYS[keyIndex];
    
    // Move to the next key for the next request
    keyIndex = (keyIndex + 1) % API_KEYS.length;

    try {
      const genAI = new GoogleGenerativeAI(currentKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imageParts = [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageData,
          },
        },
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Data) {
        throw new Error('API response did not contain an image.');
      }

      // If successful, send the response and break the loop
      return res.status(200).json({ base64Data });

    } catch (error) {
      console.error(`API Key ${keyIndex} failed:`, error.message);
      // If there's an error, the loop will continue to the next key
      if (i === API_KEYS.length - 1) {
        // If all keys have been tried, send a final error response
        return res.status(500).json({ error: `All API keys failed: ${error.message}` });
      }
    }
  }
}
