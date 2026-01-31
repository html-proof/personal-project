import OpenAI from 'openai';
import { NextRequest } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder();

    try {
        const { message, history } = await request.json();

        console.log('Chat API called with message:', message?.substring(0, 50));
        console.log('API Key exists:', !!OPENAI_API_KEY);

        if (!message) {
            return new Response(
                JSON.stringify({ error: 'Message is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY not found in environment variables');
            return new Response(
                JSON.stringify({ error: 'API key not configured. Please add OPENAI_API_KEY to your environment variables.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Initialize OpenAI
        const openai = new OpenAI({
            apiKey: OPENAI_API_KEY,
        });

        // Build conversation messages
        const messages = [
            {
                role: 'system' as const,
                content: `You are a helpful AI study assistant for College of Engineering Poonjar e-learning platform. 
Your role is to help students with their studies by:
- Answering questions about their course materials
- Explaining concepts in simple terms
- Providing study tips and guidance
- Helping with homework and assignments (guide them, don't just give answers)

Be friendly, encouraging, and educational. Keep responses concise and easy to understand.`
            },
            ...(history || []).map((msg: { role: string; content: string }) => ({
                role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                content: msg.content
            })),
            {
                role: 'user' as const,
                content: message
            }
        ];

        console.log('Calling OpenAI API with streaming...');

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const response = await openai.chat.completions.create({
                        model: 'gpt-4o-mini',
                        messages,
                        stream: true,
                    });

                    let fullResponse = '';

                    for await (const chunk of response) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            fullResponse += content;
                            const data = JSON.stringify({ text: content, done: false });
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
