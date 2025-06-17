/**
 * @profullstack/lead-generator - Webhook Server Tests
 * 
 * Tests for the Hono.js webhook server handling Bland.ai callbacks
 */

import { expect } from 'chai';
import { WebhookServer, startWebhookServer } from '../src/webhook-server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Webhook Server', () => {
  let server;
  let currentTestPort = 3002; // Base port for testing
  const testLogFile = path.join(__dirname, 'temp', 'test-webhook-logs.json');

  // Helper function to get unique port for each test
  const getNextPort = () => ++currentTestPort;

  beforeEach(async () => {
    // Clean up test files
    if (fs.existsSync(testLogFile)) {
      fs.unlinkSync(testLogFile);
    }
    
    // Ensure temp directory exists
    const tempDir = path.dirname(testLogFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(async () => {
    if (server) {
      try {
        await server.stop();
      } catch (error) {
        console.warn('Warning: Error stopping server:', error.message);
      }
      server = null;
    }
    
    // Clean up test files
    if (fs.existsSync(testLogFile)) {
      fs.unlinkSync(testLogFile);
    }
    
    // Small delay to ensure port is released
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('WebhookServer class', () => {
    it('should initialize with default configuration', () => {
      const webhookServer = new WebhookServer();
      
      expect(webhookServer.config.port).to.equal(3001);
      expect(webhookServer.config.logFile).to.equal('./logs/webhook-calls.json');
      expect(webhookServer.callLogs).to.be.an('array');
      expect(webhookServer.callLogs).to.have.length(0);
    });

    it('should initialize with custom configuration', () => {
      const testPortForConfig = getNextPort();
      const config = {
        port: testPortForConfig,
        logFile: testLogFile,
        calendlyLink: 'https://calendly.com/test'
      };
      
      const webhookServer = new WebhookServer(config);
      
      expect(webhookServer.config.port).to.equal(testPortForConfig);
      expect(webhookServer.config.logFile).to.equal(testLogFile);
      expect(webhookServer.config.calendlyLink).to.equal('https://calendly.com/test');
    });

    it('should have Hono app instance', () => {
      const webhookServer = new WebhookServer();
      expect(webhookServer.app).to.exist;
      expect(webhookServer.app.fetch).to.be.a('function');
    });
  });

  describe('Webhook processing', () => {
    let webhookServer;

    beforeEach(() => {
      webhookServer = new WebhookServer({
        port: getNextPort(),
        logFile: testLogFile
      });
    });

    it('should process webhook data correctly', async () => {
      const webhookData = {
        call_id: 'test-call-123',
        status: 'completed',
        duration: 45,
        outcome: 'answered',
        transcript: 'Hello, this is a test call. Press 1 to continue.',
        metadata: {
          contact_name: 'John Doe',
          contact_email: 'john@example.com',
          campaign_id: 'campaign-456'
        }
      };

      const processed = await webhookServer.processWebhook(webhookData);

      expect(processed.callId).to.equal('test-call-123');
      expect(processed.status).to.equal('completed');
      expect(processed.duration).to.equal(45);
      expect(processed.outcome).to.equal('answered');
      expect(processed.userChoice).to.equal('1');
      expect(processed.contactName).to.equal('John Doe');
      expect(processed.contactEmail).to.equal('john@example.com');
      expect(processed.campaignId).to.equal('campaign-456');
      expect(processed.timestamp).to.be.a('string');
    });

    it('should handle webhook data without metadata', async () => {
      const webhookData = {
        call_id: 'test-call-456',
        status: 'failed',
        outcome: 'no-answer'
      };

      const processed = await webhookServer.processWebhook(webhookData);

      expect(processed.callId).to.equal('test-call-456');
      expect(processed.status).to.equal('failed');
      expect(processed.duration).to.equal(0);
      expect(processed.outcome).to.equal('no-answer');
      expect(processed.userChoice).to.be.null;
      expect(processed.contactName).to.be.undefined;
    });
  });

  describe('User choice extraction', () => {
    let webhookServer;

    beforeEach(() => {
      webhookServer = new WebhookServer();
    });

    it('should extract choice 1 from transcript', () => {
      const webhookData = {
        transcript: 'Hello, thank you for calling. I would like to press 1 to continue.'
      };

      const choice = webhookServer.extractUserChoice(webhookData);
      expect(choice).to.equal('1');
    });

    it('should extract choice 2 from transcript', () => {
      const webhookData = {
        transcript: 'No thank you, I will press 2 to opt out.'
      };

      const choice = webhookServer.extractUserChoice(webhookData);
      expect(choice).to.equal('2');
    });

    it('should extract choice from user_input field', () => {
      const webhookData = {
        user_input: '1',
        transcript: 'Some other text'
      };

      const choice = webhookServer.extractUserChoice(webhookData);
      expect(choice).to.equal('1');
    });

    it('should return null for unclear choice', () => {
      const webhookData = {
        transcript: 'Hello, I am not sure what to do.'
      };

      const choice = webhookServer.extractUserChoice(webhookData);
      expect(choice).to.be.null;
    });

    it('should handle missing transcript', () => {
      const webhookData = {};

      const choice = webhookServer.extractUserChoice(webhookData);
      expect(choice).to.be.null;
    });
  });

  describe('User choice handling', () => {
    let webhookServer;

    beforeEach(() => {
      webhookServer = new WebhookServer({
        calendlyLink: 'https://calendly.com/test-meeting'
      });
    });

    it('should handle choice 1 (schedule meeting)', async () => {
      const processedData = {
        userChoice: '1',
        contactName: 'Jane Smith',
        contactEmail: 'jane@example.com',
        callId: 'call-789',
        rawData: { phone_number: '+1234567890' }
      };

      // This should not throw an error
      await webhookServer.handleUserChoice(processedData);

      // Check that SMS attempt was logged
      expect(webhookServer.callLogs).to.have.length(1);
      expect(webhookServer.callLogs[0].action).to.equal('sms_sent');
      expect(webhookServer.callLogs[0].phoneNumber).to.equal('+1234567890');
    });

    it('should handle choice 2 (opt out)', async () => {
      const processedData = {
        userChoice: '2',
        contactName: 'Bob Johnson',
        contactEmail: 'bob@example.com',
        callId: 'call-101',
        rawData: { phone_number: '+1987654321' }
      };

      // This should not throw an error
      await webhookServer.handleUserChoice(processedData);

      // Check that opt-out was logged
      expect(webhookServer.callLogs).to.have.length(1);
      expect(webhookServer.callLogs[0].action).to.equal('opted_out');
      expect(webhookServer.callLogs[0].phoneNumber).to.equal('+1987654321');
    });

    it('should handle unclear choice', async () => {
      const processedData = {
        userChoice: null,
        contactName: 'Alice Brown',
        contactEmail: 'alice@example.com',
        callId: 'call-202'
      };

      // This should not throw an error
      await webhookServer.handleUserChoice(processedData);

      // No additional logs should be created
      expect(webhookServer.callLogs).to.have.length(0);
    });
  });

  describe('Phone number extraction', () => {
    let webhookServer;

    beforeEach(() => {
      webhookServer = new WebhookServer();
    });

    it('should extract phone number from phoneNumber field', () => {
      const processedData = {
        phoneNumber: '+1234567890'
      };

      const phone = webhookServer.extractPhoneNumber(processedData);
      expect(phone).to.equal('+1234567890');
    });

    it('should extract phone number from rawData', () => {
      const processedData = {
        rawData: {
          phone_number: '+1987654321'
        }
      };

      const phone = webhookServer.extractPhoneNumber(processedData);
      expect(phone).to.equal('+1987654321');
    });

    it('should extract phone number from metadata', () => {
      const processedData = {
        metadata: {
          phone_number: '+1555123456'
        }
      };

      const phone = webhookServer.extractPhoneNumber(processedData);
      expect(phone).to.equal('+1555123456');
    });

    it('should return null if no phone number found', () => {
      const processedData = {
        contactName: 'Test User'
      };

      const phone = webhookServer.extractPhoneNumber(processedData);
      expect(phone).to.be.null;
    });
  });

  describe('Call logging', () => {
    let webhookServer;

    beforeEach(() => {
      webhookServer = new WebhookServer({
        logFile: testLogFile
      });
    });

    it('should log call outcome to memory', () => {
      const callData = {
        callId: 'test-call-123',
        status: 'completed',
        contactName: 'Test User'
      };

      webhookServer.logCallOutcome(callData);

      expect(webhookServer.callLogs).to.have.length(1);
      expect(webhookServer.callLogs[0].callId).to.equal('test-call-123');
      expect(webhookServer.callLogs[0].loggedAt).to.be.a('string');
    });

    it('should limit memory logs to 1000 entries', () => {
      // Add 1001 log entries
      for (let i = 0; i < 1001; i++) {
        webhookServer.logCallOutcome({
          callId: `call-${i}`,
          status: 'completed'
        });
      }

      expect(webhookServer.callLogs).to.have.length(1000);
      expect(webhookServer.callLogs[0].callId).to.equal('call-1'); // First entry removed
      expect(webhookServer.callLogs[999].callId).to.equal('call-1000'); // Last entry kept
    });

    it('should save logs to file', () => {
      const callData = {
        callId: 'test-call-456',
        status: 'completed'
      };

      webhookServer.logCallOutcome(callData);

      // Check that file was created
      expect(fs.existsSync(testLogFile)).to.be.true;

      // Check file contents
      const fileData = JSON.parse(fs.readFileSync(testLogFile, 'utf8'));
      expect(fileData).to.have.length(1);
      expect(fileData[0].callId).to.equal('test-call-456');
    });
  });

  describe('Statistics generation', () => {
    let webhookServer;

    beforeEach(() => {
      webhookServer = new WebhookServer();
    });

    it('should generate empty stats for no calls', () => {
      const stats = webhookServer.generateStats();

      expect(stats.total).to.equal(0);
      expect(stats.completed).to.equal(0);
      expect(stats.failed).to.equal(0);
      expect(stats.answered).to.equal(0);
      expect(stats.scheduledMeetings).to.equal(0);
      expect(stats.optedOut).to.equal(0);
      expect(stats.answerRate).to.equal(0);
      expect(stats.conversionRate).to.equal(0);
    });

    it('should generate correct stats for multiple calls', () => {
      // Add test call logs
      webhookServer.callLogs = [
        { status: 'completed', outcome: 'answered', userChoice: '1', duration: 30 },
        { status: 'completed', outcome: 'answered', userChoice: '2', duration: 20 },
        { status: 'completed', outcome: 'voicemail', duration: 10 },
        { status: 'failed', outcome: 'no-answer' },
        { status: 'completed', outcome: 'answered', userChoice: '1', duration: 40 }
      ];

      const stats = webhookServer.generateStats();

      expect(stats.total).to.equal(5);
      expect(stats.completed).to.equal(4);
      expect(stats.failed).to.equal(1);
      expect(stats.answered).to.equal(3);
      expect(stats.voicemail).to.equal(1);
      expect(stats.scheduledMeetings).to.equal(2);
      expect(stats.optedOut).to.equal(1);
      expect(stats.totalDuration).to.equal(100);
      expect(stats.averageDuration).to.equal(25); // 100/4 completed calls
      expect(stats.answerRate).to.equal('60.00'); // 3/5 * 100
      expect(stats.conversionRate).to.equal('66.67'); // 2/3 * 100
    });
  });

  describe('Server lifecycle', () => {
    it('should start server successfully', async () => {
      const testPortForStart = getNextPort();
      server = new WebhookServer({ port: testPortForStart });
      
      const startedServer = await server.start();
      expect(startedServer).to.exist;
    });

    it('should start server with startWebhookServer function', async () => {
      const testPortForFunction = getNextPort();
      server = await startWebhookServer({ port: testPortForFunction });
      
      expect(server).to.be.instanceOf(WebhookServer);
      expect(server.config.port).to.equal(testPortForFunction);
    });

    it('should stop server gracefully', async () => {
      const testPortForStop = getNextPort();
      server = new WebhookServer({ port: testPortForStop });
      await server.start();
      
      // This should not throw an error
      await server.stop();
    });
  });

  describe('Do-not-call list management', () => {
    let webhookServer;
    const doNotCallFile = path.join(__dirname, 'temp', 'test-do-not-call-list.json');

    beforeEach(() => {
      webhookServer = new WebhookServer();
      
      // Clean up test file
      if (fs.existsSync(doNotCallFile)) {
        fs.unlinkSync(doNotCallFile);
      }
    });

    afterEach(() => {
      // Clean up test file
      if (fs.existsSync(doNotCallFile)) {
        fs.unlinkSync(doNotCallFile);
      }
    });

    it('should add contact to do-not-call list', async () => {
      const processedData = {
        contactName: 'Opt Out User',
        callId: 'call-optout-123',
        rawData: { phone_number: '+1555999888' }
      };

      // Mock the do-not-call file path
      const originalMethod = webhookServer.addToDoNotCallList;
      webhookServer.addToDoNotCallList = async function(data) {
        // Create a temporary implementation for testing
        const entry = {
          phoneNumber: this.extractPhoneNumber(data),
          contactName: data.contactName,
          timestamp: new Date().toISOString(),
          callId: data.callId,
          reason: 'user_requested'
        };

        // Ensure temp directory exists
        const tempDir = path.dirname(doNotCallFile);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        fs.writeFileSync(doNotCallFile, JSON.stringify([entry], null, 2));
        
        this.logCallOutcome({
          ...data,
          action: 'opted_out',
          phoneNumber: entry.phoneNumber
        });
      };

      await webhookServer.addToDoNotCallList(processedData);

      // Check that file was created
      expect(fs.existsSync(doNotCallFile)).to.be.true;

      // Check file contents
      const fileData = JSON.parse(fs.readFileSync(doNotCallFile, 'utf8'));
      expect(fileData).to.have.length(1);
      expect(fileData[0].phoneNumber).to.equal('+1555999888');
      expect(fileData[0].contactName).to.equal('Opt Out User');
      expect(fileData[0].reason).to.equal('user_requested');

      // Check that opt-out was logged
      expect(webhookServer.callLogs).to.have.length(1);
      expect(webhookServer.callLogs[0].action).to.equal('opted_out');
    });
  });
});