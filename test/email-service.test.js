/**
 * Email Service Tests
 * Testing Mailgun integration for sending emails
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { EmailService, sendEmail, sendBatchEmails } from '../src/email-service.js';

describe('Email Service', () => {
  let emailService;
  let mockMailgun;

  beforeEach(() => {
    // Mock Mailgun client
    mockMailgun = {
      messages: {
        create: sinon.stub()
      }
    };

    emailService = new EmailService({
      apiKey: 'test-api-key',
      domain: 'test-domain.com',
      client: mockMailgun
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('EmailService class', () => {
    it('should initialize with correct configuration', () => {
      const service = new EmailService({
        apiKey: 'test-key',
        domain: 'example.com',
        baseUrl: 'https://api.mailgun.net'
      });

      expect(service.config.domain).to.equal('example.com');
      expect(service.config.baseUrl).to.equal('https://api.mailgun.net');
    });

    it('should validate required configuration', () => {
      expect(() => {
        new EmailService({});
      }).to.throw('Mailgun API key is required');

      expect(() => {
        new EmailService({ apiKey: 'test' });
      }).to.throw('Mailgun domain is required');
    });

    it('should create email message object', () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
        from: 'sender@example.com',
        fromName: 'Test Sender'
      };

      const message = emailService.createMessage(emailData);

      expect(message.to).to.equal('test@example.com');
      expect(message.subject).to.equal('Test Subject');
      expect(message.html).to.equal('Test Body');
      expect(message.from).to.equal('Test Sender <sender@example.com>');
    });

    it('should handle tracking options', () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        tracking: {
          opens: true,
          clicks: true
        }
      };

      const message = emailService.createMessage(emailData);

      expect(message['o:tracking-opens']).to.equal('yes');
      expect(message['o:tracking-clicks']).to.equal('yes');
    });
  });

  describe('sendEmail', () => {
    const emailData = {
      to: 'john.doe@example.com',
      subject: 'Test Email',
      body: '<p>Hello John!</p>',
      from: 'sender@company.com',
      fromName: 'Sales Team'
    };

    it('should send email successfully', async () => {
      const mockResponse = {
        id: '<test-message-id>',
        message: 'Queued. Thank you.'
      };

      mockMailgun.messages.create.resolves(mockResponse);

      const result = await sendEmail(emailData, { client: mockMailgun, domain: 'test.com' });

      expect(result.success).to.be.true;
      expect(result.messageId).to.equal('<test-message-id>');
      expect(mockMailgun.messages.create.calledOnce).to.be.true;
    });

    it('should handle email sending errors', async () => {
      const error = new Error('Invalid email address');
      mockMailgun.messages.create.rejects(error);

      const result = await sendEmail(emailData, { client: mockMailgun, domain: 'test.com' });

      expect(result.success).to.be.false;
      expect(result.error).to.include('Invalid email address');
    });

    it('should validate email data before sending', async () => {
      const invalidEmailData = {
        to: 'invalid-email',
        subject: '',
        body: 'Test'
      };

      const result = await sendEmail(invalidEmailData, { client: mockMailgun, domain: 'test.com' });

      expect(result.success).to.be.false;
      expect(result.error).to.include('validation failed');
    });

    it('should handle dry run mode', async () => {
      const result = await sendEmail(emailData, { 
        client: mockMailgun, 
        domain: 'test.com',
        dryRun: true 
      });

      expect(result.success).to.be.true;
      expect(result.dryRun).to.be.true;
      expect(mockMailgun.messages.create.called).to.be.false;
    });
  });

  describe('sendBatchEmails', () => {
    const emailBatch = [
      {
        to: 'john@example.com',
        subject: 'Hello John',
        body: '<p>Hi John!</p>',
        leadData: { FirstName: 'John', Company: 'Acme' }
      },
      {
        to: 'jane@example.com',
        subject: 'Hello Jane',
        body: '<p>Hi Jane!</p>',
        leadData: { FirstName: 'Jane', Company: 'Beta' }
      }
    ];

    it('should send batch emails successfully', async () => {
      const mockResponse = {
        id: '<test-message-id>',
        message: 'Queued. Thank you.'
      };

      mockMailgun.messages.create.resolves(mockResponse);

      const results = await sendBatchEmails(emailBatch, {
        client: mockMailgun,
        domain: 'test.com',
        batchSize: 2,
        delay: 0
      });

      expect(results.successful).to.equal(2);
      expect(results.failed).to.equal(0);
      expect(results.results).to.have.length(2);
      expect(mockMailgun.messages.create.calledTwice).to.be.true;
    });

    it('should handle partial batch failures', async () => {
      mockMailgun.messages.create
        .onFirstCall().resolves({ id: '<msg-1>', message: 'Queued' })
        .onSecondCall().rejects(new Error('Rate limit exceeded'));

      const results = await sendBatchEmails(emailBatch, {
        client: mockMailgun,
        domain: 'test.com',
        batchSize: 2,
        delay: 0
      });

      expect(results.successful).to.equal(1);
      expect(results.failed).to.equal(1);
      expect(results.results[0].success).to.be.true;
      expect(results.results[1].success).to.be.false;
    });

    it('should respect batch size limits', async () => {
      const largeBatch = Array(5).fill().map((_, i) => ({
        to: `user${i}@example.com`,
        subject: `Test ${i}`,
        body: `Body ${i}`
      }));

      mockMailgun.messages.create.resolves({ id: '<msg>', message: 'Queued' });

      const results = await sendBatchEmails(largeBatch, {
        client: mockMailgun,
        domain: 'test.com',
        batchSize: 2,
        delay: 0
      });

      expect(results.successful).to.equal(5);
      expect(results.batches).to.equal(3); // 5 emails in batches of 2
    });

    it('should add delays between batches', async () => {
      const clock = sinon.useFakeTimers();
      
      mockMailgun.messages.create.resolves({ id: '<msg>', message: 'Queued' });

      const promise = sendBatchEmails(emailBatch, {
        client: mockMailgun,
        domain: 'test.com',
        batchSize: 1,
        delay: 1000
      });

      // Fast-forward time
      clock.tick(2000);
      
      const results = await promise;
      
      expect(results.successful).to.equal(2);
      
      clock.restore();
    });
  });

  describe('Email validation', () => {
    it('should validate email addresses', () => {
      expect(emailService.isValidEmail('test@example.com')).to.be.true;
      expect(emailService.isValidEmail('user.name+tag@domain.co.uk')).to.be.true;
      expect(emailService.isValidEmail('invalid-email')).to.be.false;
      expect(emailService.isValidEmail('')).to.be.false;
      expect(emailService.isValidEmail(null)).to.be.false;
    });

    it('should validate email data completeness', () => {
      const validEmail = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body'
      };

      const invalidEmail = {
        to: 'invalid-email',
        subject: '',
        body: 'Test'
      };

      expect(emailService.validateEmailData(validEmail).isValid).to.be.true;
      expect(emailService.validateEmailData(invalidEmail).isValid).to.be.false;
    });
  });

  describe('Rate limiting and retry logic', () => {
    it('should handle rate limiting with retry', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;

      mockMailgun.messages.create
        .onFirstCall().rejects(rateLimitError)
        .onSecondCall().resolves({ id: '<msg>', message: 'Queued' });

      const emailData = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body'
      };

      const result = await sendEmail(emailData, {
        client: mockMailgun,
        domain: 'test.com',
        maxRetries: 2,
        retryDelay: 100
      });

      expect(result.success).to.be.true;
      expect(mockMailgun.messages.create.calledTwice).to.be.true;
    });

    it('should fail after max retries', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;

      mockMailgun.messages.create.rejects(rateLimitError);

      const emailData = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body'
      };

      const result = await sendEmail(emailData, {
        client: mockMailgun,
        domain: 'test.com',
        maxRetries: 2,
        retryDelay: 10
      });

      expect(result.success).to.be.false;
      expect(result.error).to.include('Rate limit exceeded');
    });
  });

  describe('Email templates and formatting', () => {
    it('should format HTML email properly', () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Plain text body',
        isHtml: false
      };

      const message = emailService.createMessage(emailData);
      expect(message.text).to.equal('Plain text body');
      expect(message.html).to.be.undefined;
    });

    it('should handle both HTML and text versions', () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test',
        body: '<p>HTML body</p>',
        textBody: 'Plain text version',
        isHtml: true
      };

      const message = emailService.createMessage(emailData);
      expect(message.html).to.equal('<p>HTML body</p>');
      expect(message.text).to.equal('Plain text version');
    });
  });
});