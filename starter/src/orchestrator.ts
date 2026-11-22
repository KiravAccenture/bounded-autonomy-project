import { query, AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { ReviewReport, ReviewReportSchema, ReviewReportJSONSchema } from './types';
import { buildOrchestratorPrompt } from './prompts';
import { codeQualityAnalyzer, testCoverageAnalyzer, refactoringSuggester } from './agents';

/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {
  /**
   * API key for Claude (defaults to ANTHROPIC_API_KEY environment variable)
   */
  apiKey?: string;

  /**
   * Model to use for orchestration (defaults to ANTHROPIC_MODEL environment variable)
   * Should be "sonnet" for best results with multi-agent coordination
   */
  model?: string;

  /**
   * Maximum number of turns for the orchestrator
   * Higher values allow more complex reasoning and agent coordination
   * @default 20
   */
  maxTurns?: number;

  /**
   * Whether to log detailed debug information
   * @default false
   */
  debug?: boolean;

  /**
   * Whether to use demo mode (returns mock data for testing)
   * Useful for testing without full SDK setup
   * @default false
   */
  demoMode?: boolean;
}


/**
 * Main Code Review Orchestrator
 *
 * Coordinates three specialized subagents to perform comprehensive code review:
 * 1. Code Quality Analyzer - Security, performance, maintainability issues
 * 2. Test Coverage Analyzer - Test gap identification and suggestions
 * 3. Refactoring Suggester - Modernization and structural improvements
 *
 * Uses the Claude Agent SDK to orchestrate parallel analysis and aggregate results
 * into a structured ReviewReport.
 */
export class CodeReviewOrchestrator {
  private apiKey: string;
  private model: string;
  private maxTurns: number;
  private debug: boolean;
  private demoMode: boolean;
  private agents: Record<string, AgentDefinition>;

  constructor(options: OrchestratorOptions = {}) {
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = options.model || process.env.ANTHROPIC_MODEL || 'sonnet';
    this.maxTurns = options.maxTurns ?? 20;
    this.debug = options.debug ?? false;
    this.demoMode = options.demoMode ?? false;

    // Register subagents
    this.agents = {
      'code-quality-analyzer': codeQualityAnalyzer,
      'test-coverage-analyzer': testCoverageAnalyzer,
      'refactoring-suggester': refactoringSuggester
    };

    if (this.debug) {
      console.debug('[Orchestrator] Initialized with:', {
        model: this.model,
        maxTurns: this.maxTurns,
        demoMode: this.demoMode,
        agents: Object.keys(this.agents)
      });
    }
  }

  /**
   * Review a pull request using parallel subagent analysis
   *
   * Process:
   * 1. Builds orchestrator prompt with PR details
   * 2. Invokes SDK query with subagents and structured output format
   * 3. Iterates through async message stream
   * 4. Extracts structured JSON output from final result
   * 5. Validates against ReviewReportSchema
   * 6. Returns parsed ReviewReport
   *
   * @param owner - Repository owner (e.g., "anthropics")
   * @param repo - Repository name (e.g., "anthropic-sdk")
   * @param prNumber - Pull request number
   * @returns Complete review report with findings from all subagents
   * @throws Error if SDK query fails or output validation fails
   */
  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    if (this.debug) {
      console.debug(`[Orchestrator] Starting review: ${owner}/${repo}#${prNumber}`);
    }

    // Demo mode: Return mock data for testing
    if (this.demoMode) {
      return this.generateDemoReport(owner, repo, prNumber);
    }

    // Build the orchestrator prompt with PR context
    const orchestratorPrompt = buildOrchestratorPrompt(owner, repo, prNumber);

    let reviewReport: ReviewReport | null = null;
    let lastError: Error | null = null;
    const startTime = Date.now();

    try {
      // Execute query with orchestrator prompt and subagents
      for await (const message of query({
        prompt: orchestratorPrompt,
        options: {
          // Model configuration
          model: this.model,

          // Subagent registration - these agents can be invoked via Task tool
          agents: this.agents,

          // The orchestrator uses the Task tool to invoke subagents
          allowedTools: ['Task'],

          // Structured output configuration - ensures output matches ReviewReportSchema
          outputFormat: {
            type: 'json_schema' as const,
            schema: ReviewReportJSONSchema
          },

          // Maximum turns to prevent infinite loops
          maxTurns: this.maxTurns
        }
      })) {
        // Log all message types for debugging
        if (this.debug) {
          console.debug(`[Orchestrator] Message type: ${message.type}`);

          if (message.type === 'assistant' && message.message?.content) {
            const content = message.message.content;
            if (Array.isArray(content)) {
              console.debug('[Orchestrator] Assistant content blocks:', content.map(c => ({ type: (c as any).type })));
            }
          }
        }

        // Handle the final result message
        if (message.type === 'result') {
          if (this.debug) {
            console.debug('[Orchestrator] Result message:', {
              subtype: message.subtype,
              hasStructuredOutput: !!(message as any).structured_output,
              hasResult: !!(message as any).result,
              resultPreview: (message as any).result?.substring(0, 200)
            });
          }
          if (message.subtype === 'success') {
            if (this.debug) {
              console.debug('[Orchestrator] Query succeeded', {
                duration: (message as any).duration_ms,
                turns: (message as any).num_turns,
                cost: (message as any).total_cost_usd
              });
            }

            // Extract structured output from result
            let outputData: unknown = null;
            const successMessage = message as any;

            // Try structured_output first (SDK structured output format)
            if (successMessage.structured_output) {
              outputData = successMessage.structured_output;
            }
            // Fallback: Try parsing JSON from result text
            else if (successMessage.result) {
              try {
                // Extract JSON from the result (handle case where text wraps JSON)
                const jsonMatch = successMessage.result.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  outputData = JSON.parse(jsonMatch[0]);
                }
              } catch (parseError) {
                // JSON parsing failed, outputData remains null
              }
            }

            if (outputData) {
              // Parse and validate against Zod schema
              const parseResult = ReviewReportSchema.safeParse(outputData);

              if (parseResult.success) {
                reviewReport = parseResult.data;
              } else {
                lastError = new Error(
                  `Output validation failed: ${JSON.stringify(parseResult.error.errors)}`
                );
              }
            } else {
              lastError = new Error(
                'No structured output returned from orchestrator. ' +
                'The model may not have returned valid JSON.'
              );
            }
          } else {
            // Handle errors from query execution
            const errorDetails = (message as any).errors?.join(', ') || message.subtype;
            lastError = new Error(`Orchestrator failed: ${errorDetails}`);
          }
        }

        // Handle other message types if debugging
        if (this.debug && message.type === 'system') {
          console.debug('[Orchestrator] System message:', message);
        }
      }

      if (lastError) {
        throw lastError;
      }

      if (!reviewReport) {
        throw new Error('No review report generated');
      }

      const duration = Date.now() - startTime;
      if (this.debug) {
        console.debug(`[Orchestrator] Review completed in ${duration}ms`, {
          totalFiles: reviewReport.summary.totalFiles,
          overallScore: reviewReport.summary.overallScore,
          criticalIssues: reviewReport.summary.criticalIssues
        });
      }

      return reviewReport;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Orchestrator] Review failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Generate a demo/mock ReviewReport for testing without real API
   * Shows what the system would return once fully integrated
   */
  private generateDemoReport(
    owner: string,
    repo: string,
    prNumber: number
  ): ReviewReport {
    const now = new Date().toISOString();

    return {
      pullRequest: {
        owner,
        repo,
        number: prNumber
      },
      fileReviews: [
        {
          file: 'src/index.ts',
          codeQuality: {
            file: 'src/index.ts',
            issues: [
              {
                line: 42,
                severity: 'high',
                category: 'security',
                description: 'Potential SQL injection vulnerability',
                suggestion: 'Use parameterized queries or an ORM'
              },
              {
                line: 85,
                severity: 'medium',
                category: 'performance',
                description: 'N+1 query pattern detected',
                suggestion: 'Use JOIN or batch loading'
              }
            ],
            overallScore: 72,
            summary: 'Found 2 issues: 1 security concern and 1 performance issue'
          },
          testCoverage: {
            file: 'src/index.ts',
            hasTests: true,
            testFiles: ['tests/index.test.ts'],
            untestedPaths: [
              {
                type: 'function',
                location: 'handleError (line 100)',
                priority: 'high',
                reasoning: 'Error handler not covered by tests',
                suggestedTest: 'Test various error scenarios and edge cases'
              }
            ],
            coverageEstimate: 65,
            summary: 'Good coverage overall with gaps in error handling'
          },
          refactorings: {
            file: 'src/index.ts',
            suggestions: [
              {
                type: 'extract-function',
                location: 'processData (line 50-70)',
                impact: 'high',
                description: 'Extract data processing logic into separate function',
                before: 'const result = data.filter(...).map(...).sort(...)',
                after: 'const result = processAndSortData(data)',
                benefits: 'Improves readability, testability, and reusability'
              },
              {
                type: 'modernize',
                location: 'asyncOperation (line 110)',
                impact: 'medium',
                description: 'Replace Promise chains with async/await',
                before: 'return fn().then(x => x.then(y => y))',
                after: 'const x = await fn(); return await x;',
                benefits: 'More readable and maintainable async code'
              }
            ],
            summary: '2 refactoring opportunities found'
          }
        },
        {
          file: 'src/utils/helpers.ts',
          codeQuality: {
            file: 'src/utils/helpers.ts',
            issues: [],
            overallScore: 92,
            summary: 'No issues found - excellent code quality'
          },
          testCoverage: {
            file: 'src/utils/helpers.ts',
            hasTests: true,
            testFiles: ['tests/utils/helpers.test.ts'],
            untestedPaths: [],
            coverageEstimate: 95,
            summary: 'Comprehensive test coverage'
          },
          refactorings: {
            file: 'src/utils/helpers.ts',
            suggestions: [
              {
                type: 'simplify',
                location: 'validateInput (line 25)',
                impact: 'low',
                description: 'Simplify nested conditionals',
                before: 'if (a) { if (b) { if (c) { return true; } } }',
                after: 'if (a && b && c) { return true; }',
                benefits: 'Reduces nesting and improves readability'
              }
            ],
            summary: '1 minor refactoring opportunity'
          }
        }
      ],
      summary: {
        totalFiles: 2,
        overallScore: 82,
        criticalIssues: 0,
        highPriorityTests: 1,
        refactoringOpportunities: 3
      },
      recommendations: [
        {
          priority: 'high',
          category: 'Security',
          description: 'SQL injection vulnerability in query building',
          files: ['src/index.ts']
        },
        {
          priority: 'high',
          category: 'Testing',
          description: 'Error handling code lacks test coverage',
          files: ['src/index.ts']
        },
        {
          priority: 'medium',
          category: 'Performance',
          description: 'N+1 query pattern detected',
          files: ['src/index.ts']
        },
        {
          priority: 'medium',
          category: 'Refactoring',
          description: 'Extract data processing logic into separate function',
          files: ['src/index.ts']
        },
        {
          priority: 'low',
          category: 'Code Quality',
          description: 'Simplify nested conditionals in validation',
          files: ['src/utils/helpers.ts']
        }
      ],
      metadata: {
        analyzedAt: now,
        duration: 2500,
        agentVersions: {
          'code-quality-analyzer': '1.0.0',
          'test-coverage-analyzer': '1.0.0',
          'refactoring-suggester': '1.0.0'
        }
      }
    };
  }
}
