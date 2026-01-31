import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { NextRequest } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder();

    try {
        const { message, history } = await request.json();

        console.log('Chat API called with message:', message?.substring(0, 50));
        console.log('API Key exists:', !!GEMINI_API_KEY);

        if (!message) {
            return new Response(
                JSON.stringify({ error: 'Message is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return new Response(
                JSON.stringify({ error: 'API key not configured. Please add GEMINI_API_KEY to your environment variables.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Google GenAI
        const ai = new GoogleGenAI({
            apiKey: GEMINI_API_KEY,
        });

        // Configure tools and thinking
        const tools = [
            {
                googleSearch: {}
            },
        ];

        const config = {
            thinkingConfig: {
                thinkingLevel: ThinkingLevel.HIGH,
            },
            tools,
            systemInstruction: `You are a helpful AI study assistant for College of Engineering Poonjar e-learning platform. 
Your role is to help students with their studies by:
- Answering questions about their course materials
- Explaining concepts in simple terms
- Providing study tips and guidance
- Helping with homework and assignments (guide them, don't just give answers)
- Using Google Search when you need current information or to verify facts

Be friendly, encouraging, and educational. Keep responses concise and easy to understand.`,
        };

        // Build conversation contents
        const contents = [
            ...(history || []).map((msg: { role: string; content: string }) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })),
            {
                role: 'user' as const,
                parts: [{ text: message }]
            }
        ];

        console.log('Calling Gemini API with streaming...');

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const response = await ai.models.generateContentStream({
                        model: 'gemini-2.0-flash-exp',
                        config,
                        contents,
                    });

                    let fullResponse = '';

                    for await (const chunk of response) {
                        if (chunk.text) {
                            fullResponse += chunk.text;
                            const data = JSON.stringify({ text: chunk.text, done: false });
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        }
                    }

                    // Send final message
                    const finalData = JSON.stringify({ text: '', done: true, fullResponse });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                    controller.close();

                    console.log('Streaming completed');
                } catch (error) {
                    console.error('Streaming error:', error);
                    const errorData = JSON.stringify({
                        error: error instanceof Error ? error.message : 'Unknown error',
                        done: true
                    });
                    controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
