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

      expect(script).to.include('John');
      expect(script).to.include('Press 1');
      expect(script).to.include('Press 2');
    });

    it('should validate phone numbers', () => {
      expect(blandAIService.isValidPhoneNumber('+1234567890')).to.be.true;
      expect(blandAIService.isValidPhoneNumber('1234567890')).to.be.true;
      expect(blandAIService.isValidPhoneNumber('invalid')).to.be.false;
      expect(blandAIService.isValidPhoneNumber('')).to.be.false;
    });
  });

  describe('makeCall', () => {
    const contact = {
      Name: 'John Doe',
      PhoneNumber: '+1987654321',
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

      const result = await blandAIService.makeCall(contact);

      expect(result.success).to.be.true;
      expect(result.callId).to.equal('test-call-id-123');
      expect(result.status).to.equal('queued');
      expect(mockFetch.calledOnce).to.be.true;
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

      const result = await blandAIService.makeCall(contact);

      expect(result.success).to.be.false;
      expect(result.error).to.include('Invalid phone number');
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
      { Name: 'John Doe', PhoneNumber: '+1234567890' },
      { Name: 'Jane Smith', PhoneNumber: '+1987654321' }
    ];

    it('should start call campaign successfully', async () => {
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
        dryRun: false
      });

      expect(results.successful).to.equal(2);
      expect(results.failed).to.equal(0);
      expect(results.results).to.have.length(2);
    });

    it('should handle partial campaign failures', async () => {
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
        phoneNumber: '+1234567890'
      });

      expect(results.successful).to.equal(1);
      expect(results.failed).to.equal(1);
    });

    it('should respect call delays', async () => {
      const clock = sinon.useFakeTimers();
      
      mockFetch.resolves({
        ok: true,
        json: async () => ({ call_id: 'test', status: 'queued' })
      });

      const promise = startCallCampaign(contacts, {
        apiKey: 'test-key',
        phoneNumber: '+1234567890',
        delay: 1000
      });

      clock.tick(2000);
      
      const results = await promise;
      
      expect(results.successful).to.equal(2);
      
      clock.restore();
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

      // Mock current time to be within call hours
      const clock = sinon.useFakeTimers(new Date('2023-01-01 12:00:00'));
      
      expect(service.isWithinCallHours()).to.be.true;
      
      clock.restore();
    });

    it('should respect do-not-call list', () => {
      const doNotCallList = ['+1234567890', '+1987654321'];
      
      expect(blandAIService.isOnDoNotCallList('+1234567890', doNotCallList)).to.be.true;
      expect(blandAIService.isOnDoNotCallList('+1555555555', doNotCallList)).to.be.false;
    });
  });
});