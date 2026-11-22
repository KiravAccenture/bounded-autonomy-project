/**
 * Integration tests for the full system
 *
 * Note: These tests require real API keys and GitHub access
 * Run with: npm test integration.test.ts
 *
 * Or manually test with:
 * npm run dev -- <owner> <repo> <pr-number>
 */

import { describe, it, expect } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator';

describe('Integration Tests (Skipped - requires real API)', () => {
  it.skip('should review a real PR', async () => {
    // This test is skipped because it requires:
    // 1. Valid ANTHROPIC_API_KEY
    // 2. Valid ANTHROPIC_MODEL
    // 3. GitHub internet access
    // 4. The PR to actually exist
    //
    // To run manually:
    // export ANTHROPIC_API_KEY="sk-ant-..."
    // export ANTHROPIC_MODEL="claude-haiku-4-5-20251001"
    // npm run dev -- octocat Hello-World 1

    const orchestrator = new CodeReviewOrchestrator({
      model: 'claude-haiku-4-5-20251001',
      debug: true
    });

    const result = await orchestrator.reviewPullRequest('octocat', 'Hello-World', 1);

    expect(result).toBeDefined();
    expect(result.pullRequest).toBeDefined();
    expect(result.pullRequest.owner).toBe('octocat');
    expect(result.pullRequest.repo).toBe('Hello-World');
    expect(result.pullRequest.number).toBe(1);
    expect(result.fileReviews).toBeDefined();
    expect(Array.isArray(result.fileReviews)).toBe(true);
    expect(result.summary).toBeDefined();
    expect(result.summary.totalFiles).toBeGreaterThanOrEqual(0);
  });

  it.skip('should handle authentication errors gracefully', async () => {
    const orchestrator = new CodeReviewOrchestrator({
      model: 'claude-haiku-4-5-20251001',
      apiKey: 'invalid-key'
    });

    // This should throw an authentication error
    expect(async () => {
      await orchestrator.reviewPullRequest('octocat', 'Hello-World', 1);
    }).rejects.toThrow();
  });

  it.skip('should handle non-existent PR', async () => {
    // Test with PR number that likely doesn't exist
    const orchestrator = new CodeReviewOrchestrator({
      model: 'claude-haiku-4-5-20251001',
      debug: false
    });

    expect(async () => {
      await orchestrator.reviewPullRequest('octocat', 'Hello-World', 999999);
    }).rejects.toThrow();
  });
});
