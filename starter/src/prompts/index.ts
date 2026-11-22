/**
 * Centralized prompt management
 *
 * Exports all specialized agent prompts and the orchestrator prompt
 */

export { buildOrchestratorPrompt } from './orchestrator.prompt';
export { codeQualityAnalyzerPrompt } from './code-quality-analyzer.prompt';
export { testCoverageAnalyzerPrompt } from './test-coverage-analyzer.prompt';
export { refactoringSuggesterPrompt } from './refactoring-suggester.prompt';
