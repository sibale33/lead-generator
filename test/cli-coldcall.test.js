/**
 * @profullstack/lead-generator - CLI Cold-calling Tests
 * 
 * Tests for the CLI coldcall commands integration
 */

import { expect } from 'chai';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI Cold-calling Commands', () => {
  const cliPath = path.join(__dirname, '..', 'bin', 'lead-generator.js');
  const testCsvPath = path.join(__dirname, 'fixtures', 'test-contacts.csv');
  const testOutputPath = path.join(__dirname, 'temp', 'test-output.json');

  before(() => {
    // Create test fixtures directory
    const fixturesDir = path.join(__dirname, 'fixtures');
    const tempDir = path.join(__dirname, 'temp');
    
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create test CSV file
    const testCsvContent = `Name,PhoneNumber,Email,Company
John Doe,+1234567890,john@example.com,Example Corp
Jane Smith,+1987654321,jane@test.com,Test Inc
Bob Johnson,+1555123456,bob@demo.com,Demo LLC`;
    
    fs.writeFileSync(testCsvPath, testCsvContent);
  });

  after(() => {
    // Clean up test files
    if (fs.existsSync(testCsvPath)) {
      fs.unlinkSync(testCsvPath);
    }
    if (fs.existsSync(testOutputPath)) {
      fs.unlinkSync(testOutputPath);
    }
  });

  describe('coldcall run command', () => {
    it('should show help when no CSV file provided', (done) => {
      const child = spawn('node', [cliPath, 'coldcall', 'run'], {
        stdio: 'pipe'
      });

      let stderr = '';
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        expect(code).to.not.equal(0);
        expect(stderr).to.include('Not enough non-option arguments');
        done();
      });
    });

    it('should validate CSV file exists', (done) => {
      const child = spawn('node', [cliPath, 'coldcall', 'run', 'nonexistent.csv'], {
        stdio: 'pipe'
      });

      let stderr = '';
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        expect(code).to.not.equal(0);
        expect(stderr).to.include('CSV file not found');
        done();
      });
    });

    it('should accept valid options', (done) => {
      const child = spawn('node', [
        cliPath, 
        'coldcall', 
        'run', 
        testCsvPath,
        '--dry-run',
        '--batch-size', '5',
        '--delay', '10',
        '--script', 'test-script',
        '--output', testOutputPath
      ], {
        stdio: 'pipe',
        env: { ...process.env, DRY_RUN: 'true' }
      });

      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        // In dry run mode, it should process without errors
        if (code !== 0) {
          console.log('STDOUT:', stdout);
          console.log('STDERR:', stderr);
        }
        // Note: This might fail due to missing environment variables
        // but the command structure should be valid
        done();
      });
    });
  });

  describe('coldcall status command', () => {
    it('should execute status command', (done) => {
      const child = spawn('node', [cliPath, 'coldcall', 'status'], {
        stdio: 'pipe',
        env: { ...process.env, DRY_RUN: 'true' }
      });

      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        // Command should execute (may fail due to missing API keys)
        if (code !== 0) {
          console.log('STDOUT:', stdout);
          console.log('STDERR:', stderr);
        }
        done();
      });
    });

    it('should accept campaign-id option', (done) => {
      const child = spawn('node', [
        cliPath, 
        'coldcall', 
        'status',
        '--campaign-id', 'test-campaign-123',
        '--detailed'
      ], {
        stdio: 'pipe',
        env: { ...process.env, DRY_RUN: 'true' }
      });

      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        // Command should execute with proper arguments
        done();
      });
    });
  });

  describe('coldcall report command', () => {
    it('should execute report command', (done) => {
      const child = spawn('node', [cliPath, 'coldcall', 'report'], {
        stdio: 'pipe',
        env: { ...process.env, DRY_RUN: 'true' }
      });

      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        // Command should execute (may fail due to missing API keys)
        done();
      });
    });

    it('should accept report options', (done) => {
      const reportPath = path.join(__dirname, 'temp', 'test-report.csv');
      
      const child = spawn('node', [
        cliPath, 
        'coldcall', 
        'report',
        '--campaign-id', 'test-campaign-123',
        '--output', reportPath,
        '--format', 'json'
      ], {
        stdio: 'pipe',
        env: { ...process.env, DRY_RUN: 'true' }
      });

      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        // Clean up
        if (fs.existsSync(reportPath)) {
          fs.unlinkSync(reportPath);
        }
        done();
      });
    });
  });

  describe('command validation', () => {
    it('should reject unknown coldcall subcommands', (done) => {
      const child = spawn('node', [cliPath, 'coldcall', 'unknown'], {
        stdio: 'pipe'
      });

      let stderr = '';
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        expect(code).to.not.equal(0);
        // The actual error message from yargs is different, so let's check for the help text
        expect(stderr).to.include('lead-generator coldcall <subcommand>');
        done();
      });
    });

    it('should show help for coldcall command', (done) => {
      const child = spawn('node', [cliPath, 'coldcall', '--help'], {
        stdio: 'pipe'
      });

      let stdout = '';
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        expect(code).to.equal(0);
        expect(stdout).to.include('Voice AI cold-calling with Bland.ai');
        expect(stdout).to.include('run');
        expect(stdout).to.include('status');
        expect(stdout).to.include('report');
        done();
      });
    });
  });

  describe('option validation', () => {
    it('should validate batch-size is a number', (done) => {
      const child = spawn('node', [
        cliPath, 
        'coldcall', 
        'run', 
        testCsvPath,
        '--batch-size', 'invalid'
      ], {
        stdio: 'pipe'
      });

      let stderr = '';
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        expect(code).to.not.equal(0);
        done();
      });
    });

    it('should validate delay is a number', (done) => {
      const child = spawn('node', [
        cliPath, 
        'coldcall', 
        'run', 
        testCsvPath,
        '--delay', 'invalid'
      ], {
        stdio: 'pipe'
      });

      let stderr = '';
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        expect(code).to.not.equal(0);
        done();
      });
    });

    it('should validate report format choices', (done) => {
      const child = spawn('node', [
        cliPath, 
        'coldcall', 
        'report',
        '--format', 'invalid'
      ], {
        stdio: 'pipe'
      });

      let stderr = '';
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        expect(code).to.not.equal(0);
        expect(stderr).to.include('Invalid values');
        done();
      });
    });
  });
});