import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  CodeQualityResultJSONSchema,
  TestCoverageResultJSONSchema,
  RefactoringSuggestionJSONSchema
} from '../src/types/analysis-results';

// ============================================================================
// CodeQualityResultSchema Tests
// ============================================================================

describe('CodeQualityResultSchema', () => {
  describe('Valid Data', () => {
    it('should accept valid code quality result', () => {
      const validData = {
        file: 'src/utils/index.ts',
        issues: [
          {
            line: 42,
            severity: 'high' as const,
            category: 'security' as const,
            description: 'SQL injection vulnerability',
            suggestion: 'Use parameterized queries'
          }
        ],
        overallScore: 75,
        summary: 'Found 1 security issue'
      };

      expect(() => CodeQualityResultSchema.parse(validData)).not.toThrow();
    });

    it('should accept result with no issues', () => {
      const validData = {
        file: 'src/clean/file.ts',
        issues: [],
        overallScore: 95,
        summary: 'No issues found'
      };

      expect(() => CodeQualityResultSchema.parse(validData)).not.toThrow();
    });

    it('should accept result with multiple issues and different categories', () => {
      const validData = {
        file: 'src/complex/file.ts',
        issues: [
          {
            line: 10,
            severity: 'critical' as const,
            category: 'security' as const,
            description: 'XSS vulnerability',
            suggestion: 'Sanitize user input'
          },
          {
            line: 20,
            severity: 'medium' as const,
            category: 'performance' as const,
            description: 'N+1 query',
            suggestion: 'Use JOIN or batch query'
          },
          {
            line: 30,
            severity: 'low' as const,
            category: 'style' as const,
            description: 'Inconsistent naming',
            suggestion: 'Follow camelCase convention'
          },
          {
            line: 40,
            severity: 'info' as const,
            category: 'best-practice' as const,
            description: 'Consider using async/await',
            suggestion: 'Replace Promise chains'
          }
        ],
        overallScore: 60,
        summary: 'Found 4 issues across multiple categories'
      };

      expect(() => CodeQualityResultSchema.parse(validData)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should accept score of 0', () => {
      const validData = {
        file: 'src/broken/file.ts',
        issues: [],
        overallScore: 0,
        summary: 'Critical issues found'
      };

      expect(() => CodeQualityResultSchema.parse(validData)).not.toThrow();
    });

    it('should accept score of 100', () => {
      const validData = {
        file: 'src/perfect/file.ts',
        issues: [],
        overallScore: 100,
        summary: 'Perfect code quality'
      };

      expect(() => CodeQualityResultSchema.parse(validData)).not.toThrow();
    });

    it('should reject score above 100', () => {
      const invalidData = {
        file: 'src/file.ts',
        issues: [],
        overallScore: 101,
        summary: 'Invalid score'
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject score below 0', () => {
      const invalidData = {
        file: 'src/file.ts',
        issues: [],
        overallScore: -1,
        summary: 'Invalid score'
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(ZodError);
    });
  });

  describe('Invalid Data', () => {
    it('should reject missing file field', () => {
      const invalidData = {
        issues: [],
        overallScore: 50,
        summary: 'Missing file'
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject missing issues field', () => {
      const invalidData = {
        file: 'src/file.ts',
        overallScore: 50,
        summary: 'Missing issues'
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject missing overallScore field', () => {
      const invalidData = {
        file: 'src/file.ts',
        issues: [],
        summary: 'Missing score'
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject missing summary field', () => {
      const invalidData = {
        file: 'src/file.ts',
        issues: [],
        overallScore: 50
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject invalid severity enum value', () => {
      const invalidData = {
        file: 'src/file.ts',
        issues: [
          {
            line: 10,
            severity: 'extreme', // Invalid enum value
            category: 'security',
            description: 'Issue',
            suggestion: 'Fix it'
          }
        ],
        overallScore: 50,
        summary: 'Invalid severity'
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject invalid category enum value', () => {
      const invalidData = {
        file: 'src/file.ts',
        issues: [
          {
            line: 10,
            severity: 'high',
            category: 'invalid-category', // Invalid enum value
            description: 'Issue',
            suggestion: 'Fix it'
          }
        ],
        overallScore: 50,
        summary: 'Invalid category'
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject non-number line', () => {
      const invalidData = {
        file: 'src/file.ts',
        issues: [
          {
            line: 'not-a-number',
            severity: 'high',
            category: 'security',
            description: 'Issue',
            suggestion: 'Fix it'
          }
        ],
        overallScore: 50,
        summary: 'Invalid line'
      };

      expect(() => CodeQualityResultSchema.parse(invalidData)).toThrow(ZodError);
    });
  });
});

// ============================================================================
// TestCoverageResultSchema Tests
// ============================================================================

describe('TestCoverageResultSchema', () => {
  describe('Valid Data', () => {
    it('should accept valid test coverage result with tests', () => {
      const validData = {
        file: 'src/utils/math.ts',
        hasTests: true,
        testFiles: ['src/utils/math.test.ts'],
        untestedPaths: [],
        coverageEstimate: 90,
        summary: 'Good test coverage'
      };

      expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();
    });

    it('should accept valid test coverage result without tests', () => {
      const validData = {
        file: 'src/config/index.ts',
        hasTests: false,
        testFiles: [],
        untestedPaths: [
          {
            type: 'function' as const,
            location: 'loadConfig (line 5)',
            priority: 'high' as const,
            reasoning: 'Main entry point needs testing',
            suggestedTest: 'Test loading valid and invalid configs'
          }
        ],
        coverageEstimate: 0,
        summary: 'No tests found'
      };

      expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();
    });

    it('should accept result with multiple untested paths', () => {
      const validData = {
        file: 'src/api/handler.ts',
        hasTests: true,
        testFiles: ['src/api/handler.test.ts'],
        untestedPaths: [
          {
            type: 'function' as const,
            location: 'handleError (line 100)',
            priority: 'critical' as const,
            reasoning: 'Error handler not covered',
            suggestedTest: 'Test various error scenarios'
          },
          {
            type: 'branch' as const,
            location: 'if (isDev) block (line 50)',
            priority: 'medium' as const,
            reasoning: 'Development path not tested',
            suggestedTest: 'Test with NODE_ENV=development'
          },
          {
            type: 'edge-case' as const,
            location: 'timeout handling (line 150)',
            priority: 'high' as const,
            reasoning: 'Edge case not covered',
            suggestedTest: 'Test timeout scenarios'
          }
        ],
        coverageEstimate: 65,
        summary: 'Partial coverage with gaps'
      };

      expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should accept coverage estimate of 0', () => {
      const validData = {
        file: 'src/file.ts',
        hasTests: false,
        testFiles: [],
        untestedPaths: [],
        coverageEstimate: 0,
        summary: 'No coverage'
      };

      expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();
    });

    it('should accept coverage estimate of 100', () => {
      const validData = {
        file: 'src/file.ts',
        hasTests: true,
        testFiles: ['src/file.test.ts'],
        untestedPaths: [],
        coverageEstimate: 100,
        summary: 'Full coverage'
      };

      expect(() => TestCoverageResultSchema.parse(validData)).not.toThrow();
    });

    it('should reject coverage above 100', () => {
      const invalidData = {
        file: 'src/file.ts',
        hasTests: true,
        testFiles: [],
        untestedPaths: [],
        coverageEstimate: 101,
        summary: 'Invalid'
      };

      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow(ZodError);
    });
  });

  describe('Invalid Data', () => {
    it('should reject invalid untested path type', () => {
      const invalidData = {
        file: 'src/file.ts',
        hasTests: false,
        testFiles: [],
        untestedPaths: [
          {
            type: 'invalid-type',
            location: 'somewhere',
            priority: 'high',
            reasoning: 'Test',
            suggestedTest: 'Test'
          }
        ],
        coverageEstimate: 0,
        summary: 'Invalid'
      };

      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject invalid priority enum value', () => {
      const invalidData = {
        file: 'src/file.ts',
        hasTests: false,
        testFiles: [],
        untestedPaths: [
          {
            type: 'function',
            location: 'somewhere',
            priority: 'extreme', // Invalid enum value
            reasoning: 'Test',
            suggestedTest: 'Test'
          }
        ],
        coverageEstimate: 0,
        summary: 'Invalid'
      };

      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject non-boolean hasTests', () => {
      const invalidData = {
        file: 'src/file.ts',
        hasTests: 'yes', // Should be boolean
        testFiles: [],
        untestedPaths: [],
        coverageEstimate: 50,
        summary: 'Invalid'
      };

      expect(() => TestCoverageResultSchema.parse(invalidData)).toThrow(ZodError);
    });
  });
});

// ============================================================================
// RefactoringSuggestionSchema Tests
// ============================================================================

describe('RefactoringSuggestionSchema', () => {
  describe('Valid Data', () => {
    it('should accept valid refactoring suggestion', () => {
      const validData = {
        file: 'src/utils/helpers.ts',
        suggestions: [
          {
            type: 'extract-function' as const,
            location: 'processData (line 50-80)',
            impact: 'high' as const,
            description: 'Extract data processing logic',
            before: 'const result = data.map(...).filter(...)',
            after: 'const result = filterAndProcess(data)',
            benefits: 'Improves readability and reusability'
          }
        ],
        summary: '1 refactoring opportunity found'
      };

      expect(() => RefactoringSuggestionSchema.parse(validData)).not.toThrow();
    });

    it('should accept result with no suggestions', () => {
      const validData = {
        file: 'src/clean/file.ts',
        suggestions: [],
        summary: 'No refactoring needed'
      };

      expect(() => RefactoringSuggestionSchema.parse(validData)).not.toThrow();
    });

    it('should accept result with multiple suggestions of different types', () => {
      const validData = {
        file: 'src/complex/file.ts',
        suggestions: [
          {
            type: 'extract-function' as const,
            location: 'calculateTax (line 10-25)',
            impact: 'high' as const,
            description: 'Extract tax calculation',
            before: 'const tax = price * 0.1',
            after: 'const tax = calculateTax(price)',
            benefits: 'Better testability'
          },
          {
            type: 'rename' as const,
            location: 'variable x (line 30)',
            impact: 'low' as const,
            description: 'Rename variable for clarity',
            before: 'let x = 0',
            after: 'let count = 0',
            benefits: 'Improves code readability'
          },
          {
            type: 'modernize' as const,
            location: 'asyncFn (line 40-50)',
            impact: 'medium' as const,
            description: 'Replace Promise chains',
            before: 'fn().then(x => x.then(y => y))',
            after: 'const x = await fn(); const y = await x;',
            benefits: 'More readable async code'
          },
          {
            type: 'simplify' as const,
            location: 'complexCondition (line 60)',
            impact: 'medium' as const,
            description: 'Simplify nested if statements',
            before: 'if (a) { if (b) { return true; } }',
            after: 'if (a && b) { return true; }',
            benefits: 'Reduces cognitive complexity'
          },
          {
            type: 'pattern-improvement' as const,
            location: 'singleton (line 70-80)',
            impact: 'high' as const,
            description: 'Apply Singleton pattern',
            before: 'new Database() everywhere',
            after: 'getInstance() with lazy loading',
            benefits: 'Better resource management'
          }
        ],
        summary: '5 refactoring opportunities found'
      };

      expect(() => RefactoringSuggestionSchema.parse(validData)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should accept suggestion with multiline code examples', () => {
      const validData = {
        file: 'src/file.ts',
        suggestions: [
          {
            type: 'extract-function' as const,
            location: 'complexLogic (line 10-50)',
            impact: 'high' as const,
            description: 'Extract complex logic',
            before: `function process(data) {
  const filtered = data.filter(x => x.valid);
  const mapped = filtered.map(x => x.value);
  return mapped.sort();
}`,
            after: `function process(data) {
  return filterAndMap(data).sort();
}`,
            benefits: 'Improves maintainability'
          }
        ],
        summary: 'Refactoring suggested'
      };

      expect(() => RefactoringSuggestionSchema.parse(validData)).not.toThrow();
    });
  });

  describe('Invalid Data', () => {
    it('should reject invalid suggestion type', () => {
      const invalidData = {
        file: 'src/file.ts',
        suggestions: [
          {
            type: 'invalid-type',
            location: 'somewhere',
            impact: 'high',
            description: 'Test',
            before: 'old',
            after: 'new',
            benefits: 'Better'
          }
        ],
        summary: 'Invalid'
      };

      expect(() => RefactoringSuggestionSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject invalid impact enum value', () => {
      const invalidData = {
        file: 'src/file.ts',
        suggestions: [
          {
            type: 'extract-function',
            location: 'somewhere',
            impact: 'extreme', // Invalid enum value
            description: 'Test',
            before: 'old',
            after: 'new',
            benefits: 'Better'
          }
        ],
        summary: 'Invalid'
      };

      expect(() => RefactoringSuggestionSchema.parse(invalidData)).toThrow(ZodError);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        file: 'src/file.ts',
        suggestions: [
          {
            type: 'extract-function',
            location: 'somewhere'
            // Missing impact, description, before, after, benefits
          }
        ],
        summary: 'Invalid'
      };

      expect(() => RefactoringSuggestionSchema.parse(invalidData)).toThrow(ZodError);
    });
  });
});

// ============================================================================
// JSON Schema Export Tests
// ============================================================================

describe('JSON Schema Exports', () => {
  describe('CodeQualityResultJSONSchema', () => {
    it('should produce a valid JSON schema object', () => {
      expect(CodeQualityResultJSONSchema).toBeDefined();
      expect(typeof CodeQualityResultJSONSchema).toBe('object');
    });

    it('should have type property', () => {
      expect(CodeQualityResultJSONSchema.type).toBeDefined();
    });

    it('should mark required fields', () => {
      const schema = CodeQualityResultJSONSchema as any;
      expect(schema.required).toBeDefined();
      expect(Array.isArray(schema.required)).toBe(true);
      expect(schema.required).toContain('file');
      expect(schema.required).toContain('issues');
      expect(schema.required).toContain('overallScore');
      expect(schema.required).toContain('summary');
    });
  });

  describe('TestCoverageResultJSONSchema', () => {
    it('should produce a valid JSON schema object', () => {
      expect(TestCoverageResultJSONSchema).toBeDefined();
      expect(typeof TestCoverageResultJSONSchema).toBe('object');
    });

    it('should have type property', () => {
      expect(TestCoverageResultJSONSchema.type).toBeDefined();
    });

    it('should mark required fields', () => {
      const schema = TestCoverageResultJSONSchema as any;
      expect(schema.required).toBeDefined();
      expect(Array.isArray(schema.required)).toBe(true);
      expect(schema.required).toContain('file');
      expect(schema.required).toContain('hasTests');
      expect(schema.required).toContain('testFiles');
      expect(schema.required).toContain('untestedPaths');
      expect(schema.required).toContain('coverageEstimate');
      expect(schema.required).toContain('summary');
    });
  });

  describe('RefactoringSuggestionJSONSchema', () => {
    it('should produce a valid JSON schema object', () => {
      expect(RefactoringSuggestionJSONSchema).toBeDefined();
      expect(typeof RefactoringSuggestionJSONSchema).toBe('object');
    });

    it('should have type property', () => {
      expect(RefactoringSuggestionJSONSchema.type).toBeDefined();
    });

    it('should mark required fields', () => {
      const schema = RefactoringSuggestionJSONSchema as any;
      expect(schema.required).toBeDefined();
      expect(Array.isArray(schema.required)).toBe(true);
      expect(schema.required).toContain('file');
      expect(schema.required).toContain('suggestions');
      expect(schema.required).toContain('summary');
    });
  });

  describe('JSON Schema Properties', () => {
    it('CodeQualityResultJSONSchema should have properties object', () => {
      const schema = CodeQualityResultJSONSchema as any;
      expect(schema.properties).toBeDefined();
      expect(typeof schema.properties).toBe('object');
      expect(schema.properties.file).toBeDefined();
      expect(schema.properties.issues).toBeDefined();
      expect(schema.properties.overallScore).toBeDefined();
      expect(schema.properties.summary).toBeDefined();
    });

    it('TestCoverageResultJSONSchema should have properties object', () => {
      const schema = TestCoverageResultJSONSchema as any;
      expect(schema.properties).toBeDefined();
      expect(typeof schema.properties).toBe('object');
      expect(schema.properties.file).toBeDefined();
      expect(schema.properties.hasTests).toBeDefined();
      expect(schema.properties.testFiles).toBeDefined();
      expect(schema.properties.untestedPaths).toBeDefined();
      expect(schema.properties.coverageEstimate).toBeDefined();
      expect(schema.properties.summary).toBeDefined();
    });

    it('RefactoringSuggestionJSONSchema should have properties object', () => {
      const schema = RefactoringSuggestionJSONSchema as any;
      expect(schema.properties).toBeDefined();
      expect(typeof schema.properties).toBe('object');
      expect(schema.properties.file).toBeDefined();
      expect(schema.properties.suggestions).toBeDefined();
      expect(schema.properties.summary).toBeDefined();
    });
  });
});
