/**
 * MCP Server Startup Test
 *
 * Tests if MCP servers can actually start and respond
 * This requires internet connection
 *
 * Run with: npm test mcp-startup.test.ts
 */

import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';

describe('MCP Server Startup (Optional - requires internet)', () => {
  it.skip('should start GitHub MCP server', async () => {
    // This test is SKIPPED by default
    // Run manually only when testing MCP server availability

    return new Promise((resolve, reject) => {
      const server = spawn('npx', ['-y', '@modelcontextprotocol/server-github'], {
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let started = false;
      let output = '';

      server.stdout?.on('data', (data) => {
        output += data.toString();
        console.log('GitHub MCP stdout:', data.toString());
        started = true;
      });

      server.stderr?.on('data', (data) => {
        output += data.toString();
        console.log('GitHub MCP stderr:', data.toString());
      });

      server.on('error', (error) => {
        console.error('GitHub MCP start error:', error);
        reject(error);
      });

      // Give it 3 seconds to start
      setTimeout(() => {
        server.kill();

        if (started) {
          console.log('✅ GitHub MCP server started successfully');
          resolve(true);
        } else {
          reject(new Error('GitHub MCP server did not produce output'));
        }
      }, 3000);
    });
  });

  it.skip('should start ESLint MCP server', async () => {
    // This test is SKIPPED by default
    // Run manually only when testing MCP server availability

    return new Promise((resolve, reject) => {
      const server = spawn('npx', ['-y', '@eslint/mcp@latest'], {
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let started = false;
      let output = '';

      server.stdout?.on('data', (data) => {
        output += data.toString();
        console.log('ESLint MCP stdout:', data.toString());
        started = true;
      });

      server.stderr?.on('data', (data) => {
        output += data.toString();
        console.log('ESLint MCP stderr:', data.toString());
      });

      server.on('error', (error) => {
        console.error('ESLint MCP start error:', error);
        reject(error);
      });

      // Give it 3 seconds to start
      setTimeout(() => {
        server.kill();

        if (started) {
          console.log('✅ ESLint MCP server started successfully');
          resolve(true);
        } else {
          reject(new Error('ESLint MCP server did not produce output'));
        }
      }, 3000);
    });
  });
});
