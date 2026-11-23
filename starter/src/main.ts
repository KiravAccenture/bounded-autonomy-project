import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { CodeReviewOrchestrator } from './orchestrator';
import { ReportGenerator } from './utils/report-generator';
import { formatError } from './utils/error-handler';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 * Usage: npm run dev <owner> <repo> <pr-number>
 *
 * Authentication:
 * - Anthropic API: Set ANTHROPIC_API_KEY and ANTHROPIC_MODEL
 * - AWS Bedrock: Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and ANTHROPIC_MODEL
 */
async function main() {
  const [owner, repo, prStr] = process.argv.slice(2);

  // ============================================================================
  // Step 1: Validate Command-Line Arguments
  // ============================================================================
  if (!owner || !repo || !prStr) {
    console.error('\n❌ Invalid arguments\n');
    console.error('Usage: npm run dev <owner> <repo> <pr-number>\n');
    console.error('Examples:');
    console.error('  npm run dev octocat Hello-World 1');
    console.error('  npm run dev anthropics anthropic-sdk 42\n');
    process.exit(1);
  }

  const prNumber = parseInt(prStr, 10);
  if (isNaN(prNumber) || prNumber <= 0) {
    console.error('\n❌ Invalid PR number\n');
    console.error('Error: pr-number must be a positive integer');
    console.error(`Received: "${prStr}"\n`);
    process.exit(1);
  }

  // ============================================================================
  // Step 2: Validate Authentication Method
  // ============================================================================
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasAWSCredentials =
    !!process.env.AWS_ACCESS_KEY_ID &&
    !!process.env.AWS_SECRET_ACCESS_KEY;

  let authMethod = '';

  if (hasAnthropicKey && !hasAWSCredentials) {
    authMethod = 'Anthropic API';
    console.log('🔐 Using Anthropic API authentication');
  } else if (hasAWSCredentials && !hasAnthropicKey) {
    authMethod = 'AWS Bedrock';
    console.log('🔐 Using AWS Bedrock authentication');

    // Validate AWS region is set
    if (!process.env.AWS_REGION) {
      console.error('\n❌ Missing AWS configuration\n');
      console.error('Error: AWS_REGION environment variable is required when using AWS Bedrock');
      console.error('Example: AWS_REGION=us-east-1\n');
      process.exit(1);
    }
    console.log(`📍 AWS Region: ${process.env.AWS_REGION}`);
  } else if (hasAnthropicKey && hasAWSCredentials) {
    console.error('\n❌ Conflicting authentication methods\n');
    console.error('Error: Both ANTHROPIC_API_KEY and AWS credentials are set');
    console.error('Please use only ONE authentication method:\n');
    console.error('Option 1: Anthropic API');
    console.error('  - Set: ANTHROPIC_API_KEY');
    console.error('  - Unset: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY\n');
    console.error('Option 2: AWS Bedrock');
    console.error('  - Set: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION');
    console.error('  - Unset: ANTHROPIC_API_KEY\n');
    process.exit(1);
  } else {
    console.error('\n❌ No authentication method configured\n');
    console.error('Error: Please set up authentication using ONE of these methods:\n');
    console.error('Option 1: Anthropic API');
    console.error('  export ANTHROPIC_API_KEY="sk-ant-..."\n');
    console.error('Option 2: AWS Bedrock');
    console.error('  export AWS_ACCESS_KEY_ID="..."\n');
    console.error('  export AWS_SECRET_ACCESS_KEY="..."\n');
    console.error('  export AWS_REGION="us-east-1"\n');
    process.exit(1);
  }

  // ============================================================================
  // Step 3: Validate ANTHROPIC_MODEL
  // ============================================================================
  if (!process.env.ANTHROPIC_MODEL) {
    console.error('\n❌ Missing model configuration\n');
    console.error('Error: ANTHROPIC_MODEL environment variable is required\n');

    if (authMethod === 'Anthropic API') {
      console.error('For Anthropic API, use:');
      console.error('  export ANTHROPIC_MODEL="claude-sonnet-4-5-20250929"\n');
    } else if (authMethod === 'AWS Bedrock') {
      console.error('For AWS Bedrock, use:');
      console.error('  export ANTHROPIC_MODEL="us.anthropic.claude-sonnet-4-5-20250929-v1:0"\n');
    }
    process.exit(1);
  }

  console.log(`📊 Using model: ${process.env.ANTHROPIC_MODEL}\n`);

  // ============================================================================
  // Step 4: Run the Review
  // ============================================================================
  console.log(`🚀 Starting code review for ${owner}/${repo}#${prNumber}`);
  console.log('⏳ Running orchestrator...\n');

  try {
    const startTime = Date.now();

    // Check if demo mode is enabled (useful for testing without full SDK setup)
    const demoMode = process.env.DEMO_MODE === 'true';
    if (demoMode) {
      console.log('💡 Running in DEMO MODE - Using sample data for testing');
      console.log('   Set DEMO_MODE=false to disable demo mode and use live API orchestrator\n');
    }

    // Create orchestrator instance
    const orchestrator = new CodeReviewOrchestrator({
      model: process.env.ANTHROPIC_MODEL,
      debug: process.env.DEBUG === 'true',
      demoMode // Live mode is default; set DEMO_MODE=true for demo mode
    });

    // Execute the review
    const result = await orchestrator.reviewPullRequest(owner, repo, prNumber);
    const duration = Date.now() - startTime;

    console.log(`✅ Review Complete! (${duration}ms)\n`);

    // =========================================================================
    // Step 5: Generate Reports
    // =========================================================================
    console.log('📝 Generating reports...');

    const reportGenerator = new ReportGenerator();

    // Create reports directory if it doesn't exist (in parent project directory)
    const reportsDir = path.join(process.cwd(), '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate filename without timestamp, using underscores for consistency
    const baseFilename = `${owner}_${repo}_${prNumber}`;

    // Generate Markdown report
    const markdownReport = reportGenerator.generateMarkdownReport(result);
    const markdownPath = path.join(reportsDir, `${baseFilename}.md`);
    fs.writeFileSync(markdownPath, markdownReport, 'utf-8');
    console.log(`  ✓ Markdown report: ${markdownPath}`);

    // Generate HTML report
    const htmlReport = reportGenerator.generateHTMLReport(result);
    const htmlPath = path.join(reportsDir, `${baseFilename}.html`);
    fs.writeFileSync(htmlPath, htmlReport, 'utf-8');
    console.log(`  ✓ HTML report: ${htmlPath}`);

    // Generate JSON report
    const jsonReport = reportGenerator.generateJSONReport(result);
    const jsonPath = path.join(reportsDir, `${baseFilename}.json`);
    fs.writeFileSync(jsonPath, jsonReport, 'utf-8');
    console.log(`  ✓ JSON report: ${jsonPath}\n`);

    // =========================================================================
    // Step 6: Display Summary
    // =========================================================================
    console.log('📊 Review Summary:');
    console.log(`  • Files reviewed: ${result.summary.totalFiles}`);
    console.log(`  • Overall score: ${result.summary.overallScore}/100`);
    console.log(`  • Critical issues: ${result.summary.criticalIssues}`);
    console.log(`  • High priority tests: ${result.summary.highPriorityTests}`);
    console.log(`  • Refactoring opportunities: ${result.summary.refactoringOpportunities}\n`);

    if (result.recommendations.length > 0) {
      console.log('🎯 Top Recommendations:');
      result.recommendations.slice(0, 5).forEach((rec, idx) => {
        const priority = {
          critical: '🚨',
          high: '⚠️',
          medium: '📝',
          low: '💡'
        }[rec.priority];
        console.log(`  ${idx + 1}. ${priority} ${rec.category}: ${rec.description}`);
      });
      console.log();
    }

    console.log('✨ All reports have been saved to the reports/ directory\n');
  } catch (error) {
    console.error('❌ Error during code review:\n');
    console.error(`   ${formatError(error)}\n`);

    if (error instanceof Error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

main();
