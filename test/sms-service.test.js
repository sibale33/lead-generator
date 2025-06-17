/**
 * SMS Service Tests
 * Tests for Twilio SMS functionality
 */

import { expect } from 'chai';
import { SmsService, createSmsFromTemplate, sendBatchSmsFromTemplates } from '../src/sms-service.js';
import { smsTemplates, getSmsTemplateById } from '../src/sms-templates/index.js';

describe('SMS Service', () => {
  describe('SmsService class', () => {
    it('should initialize with correct configuration', () => {
      const config = {
        accountSid: 'test-sid',
        authToken: 'test-token',
        fromNumber: '+1234567890',
        dryRun: true
      };
      
      const smsService = new SmsService(config);
      expect(smsService.config.accountSid).to.equal('test-sid');
      expect(smsService.config.authToken).to.equal('test-token');
      expect(smsService.config.fromNumber).to.equal('+1234567890');
      expect(smsService.config.dryRun).to.be.true;
    });

    it('should validate required configuration', () => {
      expect(() => {
        new SmsService({ dryRun: false });
      }).to.throw('Twilio Account SID is required');
    });

    it('should validate phone numbers correctly', () => {
      const smsService = new SmsService({ dryRun: true });
      
      expect(smsService.validatePhoneNumber('+12345678901')).to.be.true;
      expect(smsService.validatePhoneNumber('2345678901')).to.be.true;
      expect(smsService.validatePhoneNumber('(234) 567-8901')).to.be.true;
      expect(smsService.validatePhoneNumber('234-567-8901')).to.be.true;
      expect(smsService.validatePhoneNumber('123')).to.be.false;
      expect(smsService.validatePhoneNumber('')).to.be.false;
      expect(smsService.validatePhoneNumber(null)).to.be.false;
    });

    it('should format phone numbers correctly', () => {
      const smsService = new SmsService({ dryRun: true });
      
      expect(smsService.formatPhoneNumber('1234567890')).to.equal('+11234567890');
      expect(smsService.formatPhoneNumber('(123) 456-7890')).to.equal('+11234567890');
      expect(smsService.formatPhoneNumber('+1234567890')).to.equal('+1234567890');
      expect(smsService.formatPhoneNumber(null)).to.be.null;
    });

    it('should validate SMS data before sending', () => {
      const smsService = new SmsService({ dryRun: true });
      
      const validSms = {
        to: '+1234567890',
        message: 'Test message'
      };
      
      const validation = smsService.validateSmsData(validSms);
      expect(validation.isValid).to.be.true;
      expect(validation.errors).to.be.empty;
      
      const invalidSms = {
        to: '123',
        message: ''
      };
      
      const invalidValidation = smsService.validateSmsData(invalidSms);
      expect(invalidValidation.isValid).to.be.false;
      expect(invalidValidation.errors).to.have.length.greaterThan(0);
    });
  });

  describe('sendSms', () => {
    it('should send SMS successfully in dry run mode', async () => {
      const smsService = new SmsService({ 
        dryRun: true,
        fromNumber: '+1234567890'
      });
      
      const smsData = {
        to: '+1987654321',
        message: 'Test SMS message'
      };
      
      const result = await smsService.sendSms(smsData);
      
      expect(result.success).to.be.true;
      expect(result.dryRun).to.be.true;
      expect(result.messageId).to.include('dry-run-');
      expect(result.to).to.equal('+1987654321');
      expect(result.message).to.equal('Test SMS message');
    });

    it('should handle SMS sending errors', async () => {
      const smsService = new SmsService({ dryRun: true });
      
      const invalidSmsData = {
        to: '123', // Invalid phone number
        message: 'Test message'
      };
      
      const result = await smsService.sendSms(invalidSmsData);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('SMS validation failed');
    });

    it('should validate SMS data before sending', async () => {
      const smsService = new SmsService({ dryRun: true });
      
      const smsData = {
        to: '', // Missing phone number
        message: 'Test message'
      };
      
      const result = await smsService.sendSms(smsData);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Recipient phone number is required');
    });
  });

  describe('sendBatchSms', () => {
    it('should send batch SMS successfully', async () => {
      const smsService = new SmsService({ 
        dryRun: true,
        fromNumber: '+1234567890'
      });
      
      const smsDataArray = [
        { to: '+1111111111', message: 'Message 1' },
        { to: '+2222222222', message: 'Message 2' }
      ];
      
      const result = await smsService.sendBatchSms(smsDataArray, {
        batchSize: 2,
        delayBetweenBatches: 0
      });
      
      expect(result.success).to.be.true;
      expect(result.results).to.have.length(2);
      expect(result.stats.total).to.equal(2);
      expect(result.stats.sent).to.equal(2);
      expect(result.stats.failed).to.equal(0);
    });

    it('should handle partial batch failures', async () => {
      const smsService = new SmsService({
        dryRun: true,
        fromNumber: '+1234567890',
        maxRetries: 1,
        retryDelay: 10
      });
      
      const smsDataArray = [
        { to: '+1111111111', message: 'Valid message' },
        { to: '123', message: 'Invalid phone number' } // This will fail
      ];
      
      const result = await smsService.sendBatchSms(smsDataArray, {
        batchSize: 2,
        delayBetweenBatches: 0
      });
      
      expect(result.success).to.be.false; // Overall failure due to some failed messages
      expect(result.results).to.have.length(2);
      expect(result.stats.total).to.equal(2);
      expect(result.stats.sent).to.equal(1);
      expect(result.stats.failed).to.equal(1);
    }).timeout(10000);

    it('should respect batch size limits', async () => {
      const smsService = new SmsService({ 
        dryRun: true,
        fromNumber: '+1234567890'
      });
      
      const smsDataArray = Array.from({ length: 5 }, (_, i) => ({
        to: `+111111111${i}`,
        message: `Message ${i + 1}`
      }));
      
      const result = await smsService.sendBatchSms(smsDataArray, {
        batchSize: 2,
        delayBetweenBatches: 100
      });
      
      expect(result.success).to.be.true;
      expect(result.results).to.have.length(5);
      expect(result.stats.total).to.equal(5);
      expect(result.stats.sent).to.equal(5);
    }).timeout(5000);
  });

  describe('SMS validation', () => {
    it('should validate phone numbers', () => {
      const smsService = new SmsService({ dryRun: true });
      
      expect(smsService.validatePhoneNumber('+12345678901')).to.be.true;
      expect(smsService.validatePhoneNumber('2345678901')).to.be.true;
      expect(smsService.validatePhoneNumber('123')).to.be.false;
      expect(smsService.validatePhoneNumber('')).to.be.false;
    });

    it('should validate SMS data completeness', () => {
      const smsService = new SmsService({ dryRun: true });
      
      const validSms = {
        to: '+1234567890',
        message: 'Valid message'
      };
      
      const validation = smsService.validateSmsData(validSms);
      expect(validation.isValid).to.be.true;
      
      const invalidSms = {
        to: '',
        message: ''
      };
      
      const invalidValidation = smsService.validateSmsData(invalidSms);
      expect(invalidValidation.isValid).to.be.false;
      expect(invalidValidation.errors.length).to.be.greaterThan(0);
    });
  });

  describe('createSmsFromTemplate', () => {
    it('should create SMS from template with lead data', () => {
      const template = getSmsTemplateById('sms-expansion');
      const leadData = {
        firstName: 'John',
        companyName: 'Acme Corp',
        industry: 'technology',
        phone: '+1234567890'
      };
      const senderInfo = {
        name: 'Alex',
        company: 'Growth Co'
      };
      
      const smsData = createSmsFromTemplate(template, leadData, senderInfo);
      
      expect(smsData.to).to.equal('+1234567890');
      expect(smsData.message).to.include('John');
      expect(smsData.message).to.include('Acme Corp');
      expect(smsData.message).to.include('technology');
      expect(smsData.template).to.equal('sms-expansion');
      expect(smsData.leadData).to.equal(leadData);
    });

    it('should handle missing lead data gracefully', () => {
      const template = getSmsTemplateById('sms-direct');
      const leadData = {
        phone: '+1234567890'
        // Missing other fields
      };
      const senderInfo = { name: 'Alex' };
      
      const smsData = createSmsFromTemplate(template, leadData, senderInfo);
      
      expect(smsData.to).to.equal('+1234567890');
      expect(smsData.message).to.include('there'); // Default firstName
      expect(smsData.message).to.include('your company'); // Default companyName
    });
  });

  describe('sendBatchSmsFromTemplates', () => {
    it('should send batch SMS from templates', async () => {
      const leads = [
        {
          firstName: 'John',
          companyName: 'Acme Corp',
          phone: '+1111111111'
        },
        {
          firstName: 'Jane',
          companyName: 'Tech Inc',
          phone: '+2222222222'
        }
      ];
      
      const templates = [getSmsTemplateById('sms-expansion')];
      const senderInfo = { name: 'Alex', company: 'Growth Co' };
      
      const result = await sendBatchSmsFromTemplates(leads, templates, senderInfo, {
        smsConfig: { dryRun: true, fromNumber: '+1234567890' },
        batchSize: 2,
        delayBetweenBatches: 0
      });
      
      expect(result.success).to.be.true;
      expect(result.results).to.have.length(2);
      expect(result.stats.total).to.equal(2);
      expect(result.stats.sent).to.equal(2);
    });

    it('should filter out leads without phone numbers', async () => {
      const leads = [
        {
          firstName: 'John',
          companyName: 'Acme Corp',
          phone: '+1111111111'
        },
        {
          firstName: 'Jane',
          companyName: 'Tech Inc'
          // Missing phone number
        }
      ];
      
      const templates = [getSmsTemplateById('sms-expansion')];
      const senderInfo = { name: 'Alex' };
      
      const result = await sendBatchSmsFromTemplates(leads, templates, senderInfo, {
        smsConfig: { dryRun: true, fromNumber: '+1234567890' },
        batchSize: 2,
        delayBetweenBatches: 0
      });
      
      expect(result.success).to.be.true;
      expect(result.results).to.have.length(1); // Only one lead had phone number
      expect(result.stats.total).to.equal(1);
    });

    it('should throw error when no valid phone numbers found', async () => {
      const leads = [
        {
          firstName: 'John',
          companyName: 'Acme Corp'
          // Missing phone number
        }
      ];
      
      const templates = [getSmsTemplateById('sms-expansion')];
      const senderInfo = { name: 'Alex' };
      
      try {
        await sendBatchSmsFromTemplates(leads, templates, senderInfo, {
          smsConfig: { dryRun: true }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('No valid phone numbers found');
      }
    });
  });
});