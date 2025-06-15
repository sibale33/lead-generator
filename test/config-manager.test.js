/**
 * Configuration Manager Test Suite
 * Tests for user configuration management
 */

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  getConfigPath,
  loadConfig,
  saveConfig,
  getDefaultConfig,
  validateConfig,
  mergeConfig
} from '../src/config-manager.js';

describe('Configuration Manager', () => {
  const testConfigDir = path.join(os.tmpdir(), 'lead-generator-test');
  const testConfigPath = path.join(testConfigDir, 'config.json');

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('getConfigPath', () => {
    it('should return correct config path', () => {
      const configPath = getConfigPath();
      expect(configPath).to.include('.config/lead-generator/config.json');
      expect(configPath).to.include(os.homedir());
    });
  });

  describe('getDefaultConfig', () => {
    it('should return valid default configuration', () => {
      const config = getDefaultConfig();
      
      expect(config).to.be.an('object');
      expect(config).to.have.property('email');
      expect(config).to.have.property('voice');
      expect(config).to.have.property('ai');
      expect(config).to.have.property('general');
      
      // Check email config structure
      expect(config.email).to.have.property('mailgun');
      expect(config.email.mailgun).to.have.property('apiKey');
      expect(config.email.mailgun).to.have.property('domain');
      
      // Check voice config structure
      expect(config.voice).to.have.property('blandAI');
      expect(config.voice.blandAI).to.have.property('apiKey');
      expect(config.voice.blandAI).to.have.property('phoneNumber');
      
      // Check AI config structure
      expect(config.ai).to.have.property('openai');
      expect(config.ai.openai).to.have.property('apiKey');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const config = getDefaultConfig();
      config.email.mailgun.apiKey = 'test-key';
      config.email.mailgun.domain = 'test.com';
      config.ai.openai.apiKey = 'sk-test-openai-key';
      
      const result = validateConfig(config);
      expect(result.valid).to.be.true;
      expect(result.errors).to.be.an('array').that.is.empty;
    });

    it('should detect missing required fields', () => {
      const config = {
        email: {
          mailgun: {
            apiKey: '',
            domain: ''
          }
        }
      };
      
      const result = validateConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array').that.is.not.empty;
    });

    it('should validate email format', () => {
      const config = getDefaultConfig();
      config.email.from = 'invalid-email';
      
      const result = validateConfig(config);
      expect(result.valid).to.be.false;
      expect(result.errors.some(error => error.includes('email'))).to.be.true;
    });
  });

  describe('loadConfig', () => {
    it('should load existing config file', () => {
      const testConfig = {
        email: {
          mailgun: {
            apiKey: 'test-key',
            domain: 'test.com'
          }
        }
      };
      
      // Create test config directory and file
      fs.mkdirSync(testConfigDir, { recursive: true });
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
      
      const loadedConfig = loadConfig(testConfigPath);
      expect(loadedConfig.email.mailgun.apiKey).to.equal('test-key');
      expect(loadedConfig.email.mailgun.domain).to.equal('test.com');
      // Should also have default values merged in
      expect(loadedConfig).to.have.property('voice');
      expect(loadedConfig).to.have.property('ai');
      expect(loadedConfig).to.have.property('general');
    });

    it('should return default config if file does not exist', () => {
      const config = loadConfig(testConfigPath);
      const defaultConfig = getDefaultConfig();
      
      expect(config).to.deep.equal(defaultConfig);
    });

    it('should handle corrupted config file', () => {
      // Create test config directory and corrupted file
      fs.mkdirSync(testConfigDir, { recursive: true });
      fs.writeFileSync(testConfigPath, 'invalid json content');
      
      const config = loadConfig(testConfigPath);
      const defaultConfig = getDefaultConfig();
      
      expect(config).to.deep.equal(defaultConfig);
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', () => {
      const testConfig = {
        email: {
          mailgun: {
            apiKey: 'test-key',
            domain: 'test.com'
          }
        }
      };
      
      const result = saveConfig(testConfig, testConfigPath);
      expect(result.success).to.be.true;
      
      // Verify file was created
      expect(fs.existsSync(testConfigPath)).to.be.true;
      
      // Verify content
      const savedContent = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
      expect(savedContent).to.deep.include(testConfig);
    });

    it('should create directory if it does not exist', () => {
      const testConfig = getDefaultConfig();
      
      const result = saveConfig(testConfig, testConfigPath);
      expect(result.success).to.be.true;
      expect(fs.existsSync(testConfigDir)).to.be.true;
      expect(fs.existsSync(testConfigPath)).to.be.true;
    });

    it('should handle write errors gracefully', () => {
      const testConfig = getDefaultConfig();
      const invalidPath = '/invalid/path/config.json';
      
      const result = saveConfig(testConfig, invalidPath);
      expect(result.success).to.be.false;
      expect(result.error).to.be.a('string');
    });
  });

  describe('mergeConfig', () => {
    it('should merge partial config with defaults', () => {
      const defaultConfig = getDefaultConfig();
      const partialConfig = {
        email: {
          mailgun: {
            apiKey: 'new-key'
          }
        }
      };
      
      const merged = mergeConfig(defaultConfig, partialConfig);
      
      expect(merged.email.mailgun.apiKey).to.equal('new-key');
      expect(merged.email.mailgun.domain).to.equal(defaultConfig.email.mailgun.domain);
      expect(merged.voice).to.deep.equal(defaultConfig.voice);
    });

    it('should handle nested object merging', () => {
      const defaultConfig = getDefaultConfig();
      const partialConfig = {
        general: {
          batchSize: 500
        }
      };
      
      const merged = mergeConfig(defaultConfig, partialConfig);
      
      expect(merged.general.batchSize).to.equal(500);
      expect(merged.general.retryAttempts).to.equal(defaultConfig.general.retryAttempts);
    });
  });
});