import { describe, it, expect } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator';

describe('Simple Orchestrator Test', () => {
  it('should initialize without errors', () => {
    const orchestrator = new CodeReviewOrchestrator({
      model: 'claude-haiku-4-5-20251001',
      debug: true
    });

    expect(orchestrator).toBeDefined();
  });

  it.skip('Real PR Review (requires API key)', async () => {
    // Skip this by default - only run manually with real API key
    const orchestrator = new CodeReviewOrchestrator({
      model: 'claude-haiku-4-5-20251001',
      debug: true,
      maxTurns: 10 // Limit turns for testing
    });

    try {
      const result = await orchestrator.reviewPullRequest('octocat', 'Hello-World', 1);
      console.log('Success! Result:', JSON.stringify(result, null, 2));
      expect(result).toBeDefined();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  });
});
