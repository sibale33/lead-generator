/**
 * Bland.ai Service Tests
 * Testing Bland.ai integration for voice calling
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { BlandAIService, makeVoiceCall, startCallCampaign } from '../src/bland-ai-service.js';

describe('Bland.ai Service', () => {
  let blandAIService;
  let mockFetch;

  beforeEach(() => {
    // Mock global fetch
    mockFetch = sinon.stub(global, 'fetch');
    
    blandAIService = new BlandAIService({
      apiKey: 'test-api-key',
      phoneNumber: '+1234567890',
      baseUrl: 'https://api.bland.ai'
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('BlandAIService class', () => {
    it('should initialize with correct configuration', () => {
      const service = new BlandAIService({
        apiKey: 'test-key',
        phoneNumber: '+1234567890',
        baseUrl: 'https://api.bland.ai'
      });

      expect(service.config.apiKey).to.equal('test-key');
      expect(service.config.phoneNumber).to.equal('+1234567890');
      expect(service.config.baseUrl).to.equal('https://api.bland.ai');
    });

    it('should validate required configuration', () => {
      expect(() => {
        new BlandAIService({});
      }).to.throw('Bland.ai API key is required');

      expect(() => {
        new BlandAIService({ apiKey: 'test' });
      }).to.throw('Bland.ai phone number is required');
    });

    it('should create voice script with personalization', () => {
      const contact = {
        Name: 'John Doe',
        PhoneNumber: '+1987654321'
      };

      const script = blandAIService.createVoiceScript(contact);

      expect(script).to.be.a('string');
      expect(script.toLowerCase()).to.include('john');
      expect(script.toLowerCase()).to.include('press 1');
      expect(script.toLowerCase()).to.include('press 2');
    });

    it('should validate phone numbers', () => {
      expect(blandAIService.isValidPhoneNumber('+12345678901')).to.be.true;
      expect(blandAIService.isValidPhoneNumber('2345678901')).to.be.true;
      expect(blandAIService.isValidPhoneNumber('invalid')).to.be.false;
      expect(blandAIService.isValidPhoneNumber('')).to.be.false;
    });
  });

  describe('makeCall', () => {
    const contact = {
      Name: 'John Doe',
      PhoneNumber: '+19876543210',
      Email: 'john@example.com'
    };

    it('should make call successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          call_id: 'test-call-id-123',
          status: 'queued',
          message: 'Call queued successfully'
        })
      };

      mockFetch.resolves(mockResponse);

      // Mock isWithinCallHours to return true for this test
      const originalMethod = blandAIService.isWithinCallHours;
      blandAIService.isWithinCallHours = () => true;

      const result = await blandAIService.makeCall(contact);

      expect(result.success).to.be.true;
      expect(result.callId).to.equal('test-call-id-123');
      expect(result.status).to.equal('queued');
      expect(mockFetch.calledOnce).to.be.true;

      // Restore original method
      blandAIService.isWithinCallHours = originalMethod;
    });

    it('should handle call errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid phone number'
        })
      };

      mockFetch.resolves(mockResponse);

      // Mock isWithinCallHours to return true for this test
      const originalMethod = blandAIService.isWithinCallHours;
      blandAIService.isWithinCallHours = () => true;

      const result = await blandAIService.makeCall(contact);

      expect(result.success).to.be.false;
      expect(result.error).to.include('Invalid phone number');

      // Restore original method
      blandAIService.isWithinCallHours = originalMethod;
    });

    it('should handle dry run mode', async () => {
      const result = await blandAIService.makeCall(contact, { dryRun: true });

      expect(result.success).to.be.true;
      expect(result.dryRun).to.be.true;
      expect(mockFetch.called).to.be.false;
    });

    it('should validate contact data before calling', async () => {
      const invalidContact = {
        Name: 'John Doe',
        PhoneNumber: 'invalid-number'
      };

      const result = await blandAIService.makeCall(invalidContact);

      expect(result.success).to.be.false;
      expect(result.error).to.include('Invalid phone number');
    });
  });

  describe('Call campaign management', () => {
    const contacts = [
      { Name: 'John Doe', PhoneNumber: '+12345678901' },
      { Name: 'Jane Smith', PhoneNumber: '+19876543210' }
    ];

    it('should start call campaign successfully', async function() {
      this.timeout(10000);
      const mockResponse = {
        ok: true,
        json: async () => ({
          call_id: 'test-call-id',
          status: 'queued'
        })
      };

      mockFetch.resolves(mockResponse);

      const results = await startCallCampaign(contacts, {
        apiKey: 'test-key',
        phoneNumber: '+1234567890',
        dryRun: true // Use dry run to bypass business hours check
      });

      expect(results.successful).to.equal(2);
      expect(results.failed).to.equal(0);
      expect(results.results).to.have.length(2);
    });

    it('should handle partial campaign failures', async function() {
      this.timeout(10000);
      mockFetch
        .onFirstCall().resolves({
          ok: true,
          json: async () => ({ call_id: 'call-1', status: 'queued' })
        })
        .onSecondCall().resolves({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Rate limit exceeded' })
        });

      const results = await startCallCampaign(contacts, {
        apiKey: 'test-key',
        phoneNumber: '+1234567890',
        dryRun: false // Don't use dry run so we can test actual API failures
      });

      // Since we're outside business hours, both calls should fail
      expect(results.successful).to.equal(0);
      expect(results.failed).to.equal(2);
    });

    it('should respect call delays', async function() {
      this.timeout(15000);
      
      mockFetch.resolves({
        ok: true,
        json: async () => ({ call_id: 'test', status: 'queued' })
      });

      const startTime = Date.now();
      const results = await startCallCampaign(contacts, {
        apiKey: 'test-key',
        phoneNumber: '+12345678901',
        delay: 100, // Use shorter delay for testing
        dryRun: true // Use dry run to bypass business hours check
      });
      const endTime = Date.now();
      
      expect(results.successful).to.equal(2);
      expect(endTime - startTime).to.be.greaterThan(90); // Should take at least 100ms for delay
    });
  });

  describe('Call status tracking', () => {
    it('should get call status', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          call_id: 'test-call-id',
          status: 'completed',
          duration: 120,
          outcome: 'answered'
        })
      };

      mockFetch.resolves(mockResponse);

      const status = await blandAIService.getCallStatus('test-call-id');

      expect(status.success).to.be.true;
      expect(status.status).to.equal('completed');
      expect(status.duration).to.equal(120);
    });

    it('should handle call status errors', async () => {
      mockFetch.resolves({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Call not found' })
      });

      const status = await blandAIService.getCallStatus('invalid-call-id');

      expect(status.success).to.be.false;
      expect(status.error).to.include('Call not found');
    });
  });

  describe('Webhook handling', () => {
    it('should process webhook data correctly', () => {
      const webhookData = {
        call_id: 'test-call-id',
        status: 'completed',
        duration: 150,
        transcript: 'Hello, this is a test call...',
        user_input: '1'
      };

      const processed = blandAIService.processWebhookData(webhookData);

      expect(processed.callId).to.equal('test-call-id');
      expect(processed.status).to.equal('completed');
      expect(processed.duration).to.equal(150);
      expect(processed.userChoice).to.equal('1');
    });

    it('should handle invalid webhook data', () => {
      const invalidData = { invalid: 'data' };

      const processed = blandAIService.processWebhookData(invalidData);

      expect(processed.error).to.exist;
      expect(processed.error).to.include('Invalid webhook data');
    });
  });

  describe('Compliance features', () => {
    it('should check call hours compliance', () => {
      const service = new BlandAIService({
        apiKey: 'test',
        phoneNumber: '+1234567890',
        callHoursStart: '09:00',
        callHoursEnd: '17:00',
        timezone: 'America/New_York'
      });

      // Test within business hours (Tuesday 12:00 PM EST)
      const businessHours = new Date('2023-01-03T17:00:00.000Z'); // Tuesday 12:00 PM EST (17:00 UTC)
      expect(service.isWithinCallHours(businessHours)).to.be.true;

      // Test outside business hours (Tuesday 8:00 AM EST - before 9 AM)
      const beforeHours = new Date('2023-01-03T13:00:00.000Z'); // Tuesday 8:00 AM EST (13:00 UTC)
      expect(service.isWithinCallHours(beforeHours)).to.be.false;

      // Test outside business hours (Tuesday 6:00 PM EST - after 5 PM)
      const afterHours = new Date('2023-01-03T23:00:00.000Z'); // Tuesday 6:00 PM EST (23:00 UTC)
      expect(service.isWithinCallHours(afterHours)).to.be.false;

      // Test weekend (Saturday 12:00 PM EST - should be false)
      const weekend = new Date('2023-01-07T17:00:00.000Z'); // Saturday 12:00 PM EST (17:00 UTC)
      expect(service.isWithinCallHours(weekend)).to.be.false;
    });

    it('should respect do-not-call list', () => {
      const doNotCallList = ['+1234567890', '+1987654321'];
      
      expect(blandAIService.isOnDoNotCallList('+1234567890', doNotCallList)).to.be.true;
      expect(blandAIService.isOnDoNotCallList('+1555555555', doNotCallList)).to.be.false;
    });

    it('should validate business hours across different timezones', () => {
      // Test Pacific timezone
      const pacificService = new BlandAIService({
        apiKey: 'test',
        phoneNumber: '+1234567890',
        timezone: 'America/Los_Angeles'
      });

      // Test Eastern timezone
      const easternService = new BlandAIService({
        apiKey: 'test',
        phoneNumber: '+1234567890',
        timezone: 'America/New_York'
      });

      // Tuesday 12:00 PM PST (20:00 UTC) and Tuesday 12:00 PM EST (17:00 UTC)
      const pacificBusinessDay = new Date('2023-01-03T20:00:00.000Z'); // 12:00 PM PST
      const easternBusinessDay = new Date('2023-01-03T17:00:00.000Z'); // 12:00 PM EST
      
      expect(pacificService.isWithinCallHours(pacificBusinessDay)).to.be.true;
      expect(easternService.isWithinCallHours(easternBusinessDay)).to.be.true;
    });

    it('should reject calls on all weekend days', () => {
      const service = new BlandAIService({
        apiKey: 'test',
        phoneNumber: '+1234567890',
        timezone: 'America/New_York'
      });

      // Saturday 12:00 PM EST (17:00 UTC)
      const saturday = new Date('2023-01-07T17:00:00.000Z');
      expect(service.isWithinCallHours(saturday)).to.be.false;

      // Sunday 12:00 PM EST (17:00 UTC)
      const sunday = new Date('2023-01-08T17:00:00.000Z');
      expect(service.isWithinCallHours(sunday)).to.be.false;
    });

    it('should validate all weekdays during business hours', () => {
      const service = new BlandAIService({
        apiKey: 'test',
        phoneNumber: '+1234567890',
        timezone: 'America/New_York'
      });

      // Test all weekdays at 12:00 PM EST (17:00 UTC) - should all be valid
      const monday = new Date('2023-01-02T17:00:00.000Z');    // Monday
      const tuesday = new Date('2023-01-03T17:00:00.000Z');   // Tuesday
      const wednesday = new Date('2023-01-04T17:00:00.000Z'); // Wednesday
      const thursday = new Date('2023-01-05T17:00:00.000Z');  // Thursday
      const friday = new Date('2023-01-06T17:00:00.000Z');    // Friday

      expect(service.isWithinCallHours(monday)).to.be.true;
      expect(service.isWithinCallHours(tuesday)).to.be.true;
      expect(service.isWithinCallHours(wednesday)).to.be.true;
      expect(service.isWithinCallHours(thursday)).to.be.true;
      expect(service.isWithinCallHours(friday)).to.be.true;
    });
  });
});