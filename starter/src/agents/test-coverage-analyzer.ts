import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { testCoverageAnalyzerPrompt } from '../prompts';

/**
 * Test Coverage Analyzer Agent
 *
 * Evaluates test completeness by:
 * - Comparing source files with test files
 * - Identifying untested functions and classes
 * - Detecting edge cases without coverage
 * - Suggesting specific test cases
 * - Estimating overall coverage percentage
 *
 * Uses GitHub MCP to fetch test files and source code
 */
export const testCoverageAnalyzer: AgentDefinition = {
  description:
    'Specialized agent that evaluates test coverage by analyzing source files and identifying untested code paths, functions, and edge cases. Suggests specific, actionable test cases prioritized by criticality.',

  model: 'inherit',

  tools: [
    'Skill',
    'github-get-file-contents',
    'github-search',
    'github-list-files'
  ],

  prompt: testCoverageAnalyzerPrompt
};
