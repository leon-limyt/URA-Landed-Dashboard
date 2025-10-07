import { GoogleGenAI } from '@google/genai';

// This configures the function to run on Vercel's Edge Runtime,
// which is optimized for low-latency and streaming responses.
export const config = {
  runtime: 'edge',
};

// The handler now uses the standard Request and Response objects.
export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'A prompt is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.error('API_KEY environment variable is not set.');
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 512 }
      },
    });

    // Create a new ReadableStream to pipe the Gemini response to the client.
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    // Return the stream directly to the client.
    return new Response(readableStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error) {
    console.error('Error in generateSummary API:', error);
    return new Response(JSON.stringify({ error: 'An error occurred with the AI service.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
