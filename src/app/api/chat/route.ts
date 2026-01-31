import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(request: NextRequest) {
    try {
        const { message, history } = await request.json();

        console.log('Chat API called with message:', message?.substring(0, 50));
        console.log('API Key exists:', !!GEMINI_API_KEY);

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return NextResponse.json(
                { error: 'API key not configured. Please add GEMINI_API_KEY to your environment variables.' },
                { status: 500 }
            );
        }

        // Build conversation context
        const systemPrompt = `You are a helpful AI study assistant for College of Engineering Poonjar e-learning platform. 
Your role is to help students with their studies by:
- Answering questions about their course materials
- Explaining concepts in simple terms
- Providing study tips and guidance
- Helping with homework and assignments (guide them, don't just give answers)

Be friendly, encouraging, and educational. Keep responses concise and easy to understand.`;

        // Format conversation history for Gemini
        const contents = [
            {
                parts: [{ text: systemPrompt }]
            },
            ...(history || []).map((msg: { role: string; content: string }) => ({
                parts: [{ text: msg.content }]
            })),
            {
                parts: [{ text: message }]
            }
        ];

        console.log('Calling Gemini API...');

        // Call Gemini API
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY,
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            }),
        });

        console.log('Gemini API response status:', response.status);

        if (!response.ok) {
            const error = await response.text();
            console.error('Gemini API error:', error);
            return NextResponse.json(
                { error: `Failed to get response from AI: ${response.status}`, details: error },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('Gemini API response received');

        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

        return NextResponse.json({ response: aiResponse });

    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
