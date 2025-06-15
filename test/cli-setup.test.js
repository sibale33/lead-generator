/**
 * CLI Setup Command Test Suite
 * Tests for interactive configuration setup
 */

import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  displayConfigSummary,
  confirmSaveConfig
} from '../src/cli-setup.js';

describe('CLI Setup Command', () => {
  let consoleLogStub;
  let consoleErrorStub;
  const testConfigDir = path.join(os.tmpdir(), 'lead-generator-test');
  const testConfigPath = path.join(testConfigDir, 'config.json');

  beforeEach(() => {
    // Stub console methods
    consoleLogStub = sinon.stub(console, 'log');
    consoleErrorStub = sinon.stub(console, 'error');
    
    // Clean up test directory
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Restore stubs
    sinon.restore();
    
    // Clean up test directory
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('displayConfigSummary', () => {
    it('should display configuration summary', () => {
      const config = {
        email: {
          mailgun: {
            apiKey: 'mg-test-key',
            domain: 'test.mailgun.org'
          },
          from: 'test@example.com',
          batchSize: 50
        },
        voice: {
          blandAI: {
            apiKey: 'bland-test-key',
            phoneNumber: '+1234567890'
          },
          batchSize: 25
        },
        ai: {
          openai: {
            apiKey: 'sk-test-openai-key',
            model: 'gpt-4'
          }
        },
        webhooks: {
          enabled: true,
          port: 3001
        }
      };

      displayConfigSummary(config);

      expect(consoleLogStub.called).to.be.true;
      expect(consoleLogStub.args.some(args => 
        args[0].includes('Configuration Summary')
      )).to.be.true;
    });

    it('should mask sensitive information', () => {
      const config = {
        email: {
          mailgun: {
            apiKey: 'mg-very-long-secret-key',
            domain: 'test.mailgun.org'
          }
        },
        ai: {
          openai: {
            apiKey: 'sk-very-long-openai-secret-key',
            model: 'gpt-4'
          }
        },
        voice: {
          blandAI: {
            apiKey: 'bland-very-long-secret-key',
            phoneNumber: '+1234567890'
          }
        }
      };

      displayConfigSummary(config);

      const logOutput = consoleLogStub.args.map(args => args[0]).join(' ');
      expect(logOutput).to.include('mg-ver***');
      expect(logOutput).to.include('sk-ver***');
      expect(logOutput).to.include('bland-***');
      expect(logOutput).to.not.include('mg-very-long-secret-key');
      expect(logOutput).to.not.include('sk-very-long-openai-secret-key');
      expect(logOutput).to.not.include('bland-very-long-secret-key');
    });

    it('should handle missing voice configuration', () => {
      const config = {
        email: {
          mailgun: {
            apiKey: 'mg-test-key',
            domain: 'test.mailgun.org'
          }
        },
        ai: {
          openai: {
            apiKey: 'sk-test-openai-key',
            model: 'gpt-4'
          }
        }
      };

      // Should not throw an error
      expect(() => displayConfigSummary(config)).to.not.throw();
      
      const logOutput = consoleLogStub.args.map(args => args[0]).join(' ');
      expect(logOutput).to.include('(not set)');
    });
  });

  describe('Integration Tests', () => {
    it('should validate configuration structure', async () => {
      // Test that the configuration structure is correct
      const { getDefaultConfig } = await import('../src/config-manager.js');
      const defaultConfig = getDefaultConfig();
      
      expect(defaultConfig).to.have.property('email');
      expect(defaultConfig).to.have.property('voice');
      expect(defaultConfig).to.have.property('ai');
      expect(defaultConfig).to.have.property('general');
      expect(defaultConfig).to.have.property('webhooks');
      
      // Test that displayConfigSummary can handle the default config
      expect(() => displayConfigSummary(defaultConfig)).to.not.throw();
    });

    it('should save and load configuration correctly', async () => {
      const { saveConfig, loadConfig, getDefaultConfig } = await import('../src/config-manager.js');
      
      const testConfig = getDefaultConfig();
      testConfig.email.mailgun.apiKey = 'test-key';
      testConfig.email.mailgun.domain = 'test.com';
      testConfig.ai.openai.apiKey = 'sk-test-key';
      
      // Save config
      const saveResult = saveConfig(testConfig, testConfigPath);
      expect(saveResult.success).to.be.true;
      
      // Load config
      const loadedConfig = loadConfig(testConfigPath);
      expect(loadedConfig.email.mailgun.apiKey).to.equal('test-key');
      expect(loadedConfig.email.mailgun.domain).to.equal('test.com');
      expect(loadedConfig.ai.openai.apiKey).to.equal('sk-test-key');
    });

    it('should validate configuration properly', async () => {
      const { validateConfig, getDefaultConfig } = await import('../src/config-manager.js');
      
      // Valid config
      const validConfig = getDefaultConfig();
      validConfig.email.mailgun.apiKey = 'test-key';
      validConfig.email.mailgun.domain = 'test.com';
      validConfig.ai.openai.apiKey = 'sk-test-key';
      
      const validResult = validateConfig(validConfig);
      expect(validResult.valid).to.be.true;
      expect(validResult.errors).to.be.empty;
      
      // Invalid config
      const invalidConfig = getDefaultConfig();
      // Leave required fields empty
      
      const invalidResult = validateConfig(invalidConfig);
      expect(invalidResult.valid).to.be.false;
      expect(invalidResult.errors).to.not.be.empty;
    });
  });

  describe('Configuration Path Management', () => {
    it('should generate correct config path', async () => {
      const { getConfigPath } = await import('../src/config-manager.js');
      
      const configPath = getConfigPath();
      expect(configPath).to.include('.config/lead-generator/config.json');
      expect(configPath).to.include(os.homedir());
    });

    it('should merge configurations correctly', async () => {
      const { mergeConfig, getDefaultConfig } = await import('../src/config-manager.js');
      
      const defaultConfig = getDefaultConfig();
      const partialConfig = {
        email: {
          mailgun: {
            apiKey: 'new-key'
          }
        },
        general: {
          batchSize: 500
        }
      };
      
      const merged = mergeConfig(defaultConfig, partialConfig);
      
      expect(merged.email.mailgun.apiKey).to.equal('new-key');
      expect(merged.email.mailgun.domain).to.equal(defaultConfig.email.mailgun.domain);
      expect(merged.general.batchSize).to.equal(500);
      expect(merged.general.retryAttempts).to.equal(defaultConfig.general.retryAttempts);
      expect(merged.voice).to.deep.equal(defaultConfig.voice);
    });
  });
});