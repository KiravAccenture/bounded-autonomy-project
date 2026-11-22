import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { codeQualityAnalyzerPrompt } from '../prompts';

/**
 * Code Quality Analyzer Agent
 *
 * Analyzes code files for:
 * - Security vulnerabilities
 * - Performance issues
 * - Maintainability concerns
 * - Best practice violations
 * - Code style issues
 * - Bug risk indicators
 *
 * Uses ESLint MCP for linting analysis and can invoke JavaScript best practices skills
 */
export const codeQualityAnalyzer: AgentDefinition = {
  description:
    'Specialized agent that analyzes code files for security vulnerabilities, performance issues, maintainability concerns, style violations, and bug risks. Uses ESLint for static analysis and applies best practice rules.',

  model: 'inherit',

  tools: [
    'Skill',
    'eslint-analyze-file',
    'eslint-lint-files',
    'github-get-file-contents',
    'github-search'
  ],

  prompt: codeQualityAnalyzerPrompt
};
