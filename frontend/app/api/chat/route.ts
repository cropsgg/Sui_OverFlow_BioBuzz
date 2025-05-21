import { NextResponse } from 'next/server';

// Replace with your Together AI API key
const TOGETHER_API_KEY = 'tgp_v1_JVdftcwQ8hPzrRycZ7cPbi_kob9IyvFuNiQidACJlg4';

const WEBSITE_CONTEXT = `

Welcome to BioBuzz!
BioBuzz is a collaborative platform designed to accelerate scientific discovery through community-driven research, AI-powered assistance, and seamless integration with Sui blockchain workflows.
Main Pages:
Home: Platform overview, latest updates, and featured research.
Assistant: AI-powered research assistant for scientific questions and workflow guidance.
Papers: Browse, upload, and analyze research papers.
Community: Connect, discuss, and collaborate with other researchers.
Key Features:
AI chat assistant for research, Sui workflow, and platform guidance.
File uploads for research analysis and Sui transaction data.
Community Q&A and collaborative tools.
Sui Workflow Integration:
Onboard and connect your Sui wallet.
Submit, track, and verify research contributions on the Sui blockchain.
View transaction history and workflow status.
Leverage Sui’s secure, decentralized infrastructure for transparent research collaboration.
Mission:
Accelerate scientific discovery through open collaboration, advanced AI, and secure blockchain workflows.
Contact: support@biobuzz.com
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Prepare the prompt from the conversation
    // You can format this as you like; here we just join user/assistant turns
    const prompt = messages
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n') + '\nAssistant:';

    // Call Together AI API
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
        messages: [
          { role: "system", content: WEBSITE_CONTEXT },
          ...messages,
        ],
        max_tokens: 250,
        temperature: 0.7,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Together AI API error: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      content,
      error: null,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({
      content: null,
      error: (error as any)?.message || 'Failed to generate response',
    }, { status: 500 });
  }
}