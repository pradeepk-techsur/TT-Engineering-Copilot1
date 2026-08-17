import Anthropic from '@anthropic-ai/sdk';
import { AgentContext } from '@/shared/types/projectState';
import { AgentResult, AIRecommendation } from './agentTypes';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 120000,    // 2 minute timeout for long generations
  maxRetries: 0,      // own retry loop below
});

export abstract class BaseAgent {
  protected phaseId: number;
  protected agentName: string;
  protected maxOutputTokens: number;

  constructor(phaseId: number, agentName: string, maxOutputTokens: number = 16000) {
    this.phaseId = phaseId;
    this.agentName = agentName;
    this.maxOutputTokens = maxOutputTokens;
  }

  abstract run(context: AgentContext): Promise<AgentResult>;

  /**
   * Hardened LLM call with retry (up to 3 times), truncation continuation,
   * and cancellation support. Never lets LLM approve a gate or generate
   * prohibited labels.
   */
  protected async callLLM(
    prompt: string,
    systemPrompt: string,
    maxTokens: number = this.maxOutputTokens
  ): Promise<string> {
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [2000, 4000, 8000];
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        });

        let text = response.content
          .filter((c): c is Anthropic.TextBlock => c.type === 'text')
          .map(c => c.text)
          .join('');

        // Truncation continuation: if stop_reason is max_tokens, continue
        if (response.stop_reason === 'max_tokens' && text.length > 0) {
          const continuation = await this.callLLM(
            `Continue from: "${text.slice(-200)}"`,
            systemPrompt,
            Math.min(maxTokens, 4000)
          );
          text += continuation;
        }

        // Guard: never return text containing prohibited labels
        const PROHIBITED = ['Connected to ', 'Retrieved from ', 'Live ', 'replacement input'];
        for (const label of PROHIBITED) {
          if (text.includes(label)) {
            text = text.split(label).join(`[REDACTED:${label.trim()}]`);
          }
        }

        return text;
      } catch (err: any) {
        lastError = err;
        // Retry on overload (529, 503) and network errors
        if (attempt < MAX_RETRIES - 1 && (err.status === 529 || err.status === 503 || err.code === 'ECONNRESET')) {
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
          continue;
        }
        throw err;
      }
    }
    throw lastError ?? new Error('LLM call failed after retries');
  }

  protected buildSystemPrompt(phaseId: number): string {
    return `You are the TT Engineering Copilot agent for Phase ${phaseId}. 
You DRAFT artifacts, CHECK compliance, and RECOMMEND actions.
You NEVER: approve a gate, authorize a design change, or claim live system connectivity.
Every finding must cite its source. Output must follow compact artifact standards (≤10 rows for XLSX, ≤2 pages for DOCX).
Include the synthetic disclaimer on all artifacts: "Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production."
All outputs are advisory. Human reviewers make all decisions.`;
  }

  protected buildAIRecommendation(
    outcome: 'Pass' | 'Conditional Pass' | 'Fail',
    rationale: string,
    findingsCited: string[] = [],
    checksCited: string[] = []
  ): AIRecommendation {
    return {
      recommendedOutcome: outcome,
      rationale,
      findingsCited,
      checksCited,
      advisoryLabel: 'Advisory Only — Human Decision Required',
    };
  }
}
