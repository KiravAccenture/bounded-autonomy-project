import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { refactoringSuggesterPrompt } from '../prompts';

/**
 * Refactoring Suggester Agent
 *
 * Identifies opportunities to improve code by:
 * - Detecting modernization opportunities (e.g., newer syntax, async/await)
 * - Applying design patterns
 * - Simplifying complex logic
 * - Extracting reusable functions
 * - Improving naming clarity
 * - Reducing code duplication
 *
 * Different from Code Quality Analyzer: focuses on structural improvements
 * rather than bugs or compliance violations
 */
export const refactoringSuggester: AgentDefinition = {
  description:
    'Specialized agent that identifies code modernization and structural improvement opportunities. Suggests extract-function, rename, simplify, and design pattern improvements with concrete before/after examples.',

  model: 'inherit',

  tools: [
    'Skill',
    'github-get-file-contents',
    'github-search'
  ],

  prompt: refactoringSuggesterPrompt
};
