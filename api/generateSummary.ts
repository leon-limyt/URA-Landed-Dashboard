import { GoogleGenAI } from '@google/genai';

// Vercel automatically handles the request and response types.
// Using `any` for simplicity to avoid adding extra dependencies like `@vercel/node`.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'A prompt is required in the request body.' });
  }

  if (!process.env.API_KEY) {
    console.error('API_KEY environment variable is not set on the server.');
    return res.status(500).json({ error: 'Server configuration error. The API key is missing.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    res.status(200).json({ summary: response.text });

  } catch (error) {
    console.error('Error calling the Gemini API:', error);
    res.status(500).json({ error: 'An error occurred while communicating with the AI service.' });
  }
}
