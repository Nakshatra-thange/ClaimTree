import Anthropic from '@anthropic-ai/sdk';
import type { Issue } from './types.js';

const anthropic = new Anthropic(); 


export async function suggestFix(issue: Issue, claimText: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are assisting a patent attorney. A deterministic claim checker flagged this issue:

Issue type: ${issue.code}
Message: ${issue.message}

Full claim text:
"""
${claimText}
"""

Suggest a minimal, precise rewrite of the claim text that resolves ONLY this specific issue. Do not change anything else. Return only the corrected claim text, no commentary.`,
      },
    ],
  });

  const textBlock = msg.content.find((b) => b.type === 'text');
  return textBlock && 'text' in textBlock ? textBlock.text.trim() : '';
}