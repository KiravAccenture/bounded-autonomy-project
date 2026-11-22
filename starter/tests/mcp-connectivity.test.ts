/**
 * MCP Server Connectivity Test
 *
 * Tests whether MCP servers (GitHub, ESLint) are available and can be accessed
 *
 * Run with:
 * npm test mcp-connectivity.test.ts
 *
 * Note: GitHub MCP requires GITHUB_TOKEN environment variable for real testing
 */

import { describe, it, expect } from 'vitest';
import { mcpServersConfig } from '../src/config/mcp.config';

describe('MCP Server Configuration', () => {
  describe('Server Definitions', () => {
    it('should have GitHub MCP server configured', () => {
      expect(mcpServersConfig.github).toBeDefined();
      expect(mcpServersConfig.github.type).toBe('stdio');
      expect(mcpServersConfig.github.command).toBe('npx');
    });

    it('should have ESLint MCP server configured', () => {
      expect(mcpServersConfig.eslint).toBeDefined();
      expect(mcpServersConfig.eslint.type).toBe('stdio');
      expect(mcpServersConfig.eslint.command).toBe('npx');
    });

    it('GitHub MCP should have correct package name', () => {
      expect(mcpServersConfig.github.args).toContain('@modelcontextprotocol/server-github');
    });

    it('ESLint MCP should have correct package name', () => {
      expect(mcpServersConfig.eslint.args).toContain('@eslint/mcp@latest');
    });

    it('GitHub MCP should map GITHUB_TOKEN environment variable', () => {
      expect(mcpServersConfig.github.env).toHaveProperty('GITHUB_PERSONAL_ACCESS_TOKEN');
    });
  });

  describe('MCP Server Availability', () => {
    it('should detect GitHub token configuration', () => {
      const hasGitHubToken = !!process.env.GITHUB_TOKEN;
      console.log(`GitHub Token configured: ${hasGitHubToken}`);

      // This is optional - GitHub MCP works without token but with rate limits
      if (!hasGitHubToken) {
        console.warn('⚠️  GITHUB_TOKEN not set. GitHub MCP will have rate limits.');
      }
    });

    it('should detect Anthropic API configuration', () => {
      const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
      const hasModel = !!process.env.ANTHROPIC_MODEL;

      console.log(`API Key configured: ${hasApiKey}`);
      console.log(`Model configured: ${hasModel}`);
      console.log(`Model: ${process.env.ANTHROPIC_MODEL}`);

      expect(hasApiKey).toBe(true);
      expect(hasModel).toBe(true);
    });

    it('should check if npx is available', async () => {
      // npx should be available if npm is installed
      try {
        const { execSync } = await import('child_process');
        const result = execSync('npx --version', { encoding: 'utf-8' });
        console.log(`npx version: ${result.trim()}`);
        expect(result).toBeDefined();
      } catch (error) {
        console.error('⚠️  npx not available. MCP servers may not start.');
      }
    });
  });

  describe('MCP Server Package Availability', () => {
    it('should check if GitHub MCP package can be installed', async () => {
      // This is a dry-run check - doesn't actually install
      try {
        const { execSync } = await import('child_process');
        // Check if package exists in npm registry
        const result = execSync('npm view @modelcontextprotocol/server-github version', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`GitHub MCP latest version: ${result.trim()}`);
        expect(result).toBeDefined();
      } catch (error) {
        console.warn('⚠️  Could not verify GitHub MCP package availability');
      }
    });

    it('should check if ESLint MCP package can be installed', async () => {
      try {
        const { execSync } = await import('child_process');
        const result = execSync('npm view @eslint/mcp version', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`ESLint MCP latest version: ${result.trim()}`);
        expect(result).toBeDefined();
      } catch (error) {
        console.warn('⚠️  Could not verify ESLint MCP package availability');
      }
    });
  });
});

describe('MCP Integration Notes', () => {
  it('documents required setup for MCP servers', () => {
    console.log(`

=== MCP Server Setup Guide ===

For GitHub MCP to work:
1. Set environment variable: export GITHUB_TOKEN="your_token"
   - Get token: https://github.com/settings/tokens
   - Required scopes: repo (or public_repo for public repos only)

2. MCP will start via: npx -y @modelcontextprotocol/server-github
   - This downloads and runs the GitHub MCP server on first use
   - Requires internet connection for initial setup

For ESLint MCP to work:
1. MCP will start via: npx -y @eslint/mcp@latest
   - Downloads and runs the ESLint MCP server
   - Requires internet connection for initial setup

For Claude Agent SDK to use these MCP servers:
1. Configure mcpServersConfig in src/config/mcp.config.ts ✓
2. Pass to SDK options: { mcpServers: mcpServersConfig }
3. Configure agents with available tools from MCP servers
4. Orchestrator invokes agents which use MCP tools

Current Status:
- MCP Configuration: ✓ Defined
- GitHub Token: ${process.env.GITHUB_TOKEN ? '✓ Set' : '❌ Not set (optional)'}
- API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ Set' : '❌ Not set (required)'}
- Model: ${process.env.ANTHROPIC_MODEL ? '✓ Set' : '❌ Not set (required)'}
- Demo Mode: Can be toggled with DEMO_MODE=false
    `);
  });
});
