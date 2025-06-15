/**
 * Webhook Server Module
 * Handles Bland.ai webhook callbacks for call outcomes
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Webhook Server class for handling Bland.ai callbacks
 */
export class WebhookServer {
  constructor(config = {}) {
    this.config = {
      port: config.port || process.env.VOICE_WEBHOOK_PORT || 3001,
      logFile: config.logFile || './logs/webhook-calls.json',
      smsApiKey: config.smsApiKey || process.env.SMS_SERVICE_API_KEY,
      calendlyLink: config.calendlyLink || process.env.CALENDLY_LINK,
      ...config
    };

    this.app = express();
    this.server = null;
    this.callLogs = [];
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Add request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Add CORS headers
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });
  }

  /**
   * Setup Express routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Main webhook endpoint for Bland.ai callbacks
    this.app.post('/webhook', async (req, res) => {
      try {
        console.log('📞 Received webhook from Bland.ai:', req.body);

        const webhookData = req.body;
        const processed = await this.processWebhook(webhookData);

        // Log the call outcome
        this.logCallOutcome(processed);

        // Handle user choices
        if (processed.userChoice) {
          await this.handleUserChoice(processed);
        }

        res.json({
          success: true,
          message: 'Webhook processed successfully',
          callId: processed.callId
        });

      } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get call logs endpoint
    this.app.get('/logs', (req, res) => {
      res.json({
        logs: this.callLogs,
        total: this.callLogs.length
      });
    });

    // Get call statistics endpoint
    this.app.get('/stats', (req, res) => {
      const stats = this.generateStats();
      res.json(stats);
    });

    // Clear logs endpoint (for testing)
    this.app.delete('/logs', (req, res) => {
      this.callLogs = [];
      res.json({ message: 'Logs cleared successfully' });
    });
  }

  /**
   * Process incoming webhook data
   * @param {Object} webhookData - Raw webhook data from Bland.ai
   * @returns {Object} Processed webhook data
   */
  async processWebhook(webhookData) {
    const processed = {
      callId: webhookData.call_id,
      status: webhookData.status,
      duration: webhookData.duration || 0,
      outcome: webhookData.outcome,
      transcript: webhookData.transcript || '',
      userChoice: this.extractUserChoice(webhookData),
      timestamp: new Date().toISOString(),
      metadata: webhookData.metadata || {},
      rawData: webhookData
    };

    // Extract contact information from metadata
    if (webhookData.metadata) {
      processed.contactName = webhookData.metadata.contact_name;
      processed.contactEmail = webhookData.metadata.contact_email;
      processed.campaignId = webhookData.metadata.campaign_id;
    }

    return processed;
  }

  /**
   * Extract user choice from webhook data
   * @param {Object} webhookData - Webhook data
   * @returns {string|null} User choice (1, 2, or null)
   */
  extractUserChoice(webhookData) {
    // Check for direct user_input field
    if (webhookData.user_input) {
      return webhookData.user_input;
    }

    // Check transcript for key presses
    const transcript = webhookData.transcript || '';
    const choice1Match = transcript.match(/press(?:ed)?\s*1|one/i);
    const choice2Match = transcript.match(/press(?:ed)?\s*2|two/i);

    if (choice1Match) return '1';
    if (choice2Match) return '2';

    return null;
  }

  /**
   * Handle user choices from IVR
   * @param {Object} processedData - Processed webhook data
   */
  async handleUserChoice(processedData) {
    const { userChoice, contactName, contactEmail, callId } = processedData;

    try {
      if (userChoice === '1') {
        // User wants to schedule a meeting - send SMS with Calendly link
        console.log(`📅 ${contactName} chose to schedule a meeting`);
        
        if (this.config.calendlyLink) {
          await this.sendCalendlyLink(processedData);
        } else {
          console.warn('⚠️ Calendly link not configured');
        }

      } else if (userChoice === '2') {
        // User wants to opt out - add to do-not-call list
        console.log(`🚫 ${contactName} chose to opt out`);
        await this.addToDoNotCallList(processedData);

      } else {
        console.log(`❓ ${contactName} made no choice or unclear choice`);
      }

    } catch (error) {
      console.error(`❌ Error handling user choice for ${contactName}:`, error.message);
    }
  }

  /**
   * Send SMS with Calendly link
   * @param {Object} processedData - Processed webhook data
   */
  async sendCalendlyLink(processedData) {
    try {
      const { contactName, callId } = processedData;
      const phoneNumber = this.extractPhoneNumber(processedData);

      if (!phoneNumber) {
        console.warn(`⚠️ No phone number found for ${contactName}`);
        return;
      }

      const message = `Hi ${contactName}! Thanks for your interest. Please schedule a meeting with our team: ${this.config.calendlyLink}`;

      // Note: This is a placeholder for SMS integration
      // You would integrate with your preferred SMS service (Twilio, etc.)
      console.log(`📱 Would send SMS to ${phoneNumber}: ${message}`);

      // Log the SMS attempt
      this.logCallOutcome({
        ...processedData,
        action: 'sms_sent',
        smsMessage: message,
        phoneNumber
      });

    } catch (error) {
      console.error('❌ Failed to send Calendly SMS:', error.message);
    }
  }

  /**
   * Add contact to do-not-call list
   * @param {Object} processedData - Processed webhook data
   */
  async addToDoNotCallList(processedData) {
    try {
      const { contactName, callId } = processedData;
      const phoneNumber = this.extractPhoneNumber(processedData);

      if (!phoneNumber) {
        console.warn(`⚠️ No phone number found for ${contactName}`);
        return;
      }

      // Add to do-not-call list file
      const doNotCallFile = './logs/do-not-call-list.json';
      let doNotCallList = [];

      if (fs.existsSync(doNotCallFile)) {
        const data = fs.readFileSync(doNotCallFile, 'utf8');
        doNotCallList = JSON.parse(data);
      }

      const entry = {
        phoneNumber,
        contactName,
        timestamp: new Date().toISOString(),
        callId,
        reason: 'user_requested'
      };

      doNotCallList.push(entry);

      // Ensure logs directory exists
      const logDir = path.dirname(doNotCallFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.writeFileSync(doNotCallFile, JSON.stringify(doNotCallList, null, 2));

      console.log(`🚫 Added ${contactName} (${phoneNumber}) to do-not-call list`);

      // Log the opt-out
      this.logCallOutcome({
        ...processedData,
        action: 'opted_out',
        phoneNumber
      });

    } catch (error) {
      console.error('❌ Failed to add to do-not-call list:', error.message);
    }
  }

  /**
   * Extract phone number from processed data
   * @param {Object} processedData - Processed webhook data
   * @returns {string|null} Phone number
   */
  extractPhoneNumber(processedData) {
    // Try to get phone number from various sources
    return processedData.phoneNumber || 
           processedData.rawData?.phone_number || 
           processedData.metadata?.phone_number || 
           null;
  }

  /**
   * Log call outcome to memory and file
   * @param {Object} callData - Call outcome data
   */
  logCallOutcome(callData) {
    const logEntry = {
      ...callData,
      loggedAt: new Date().toISOString()
    };

    // Add to memory
    this.callLogs.push(logEntry);

    // Keep only last 1000 logs in memory
    if (this.callLogs.length > 1000) {
      this.callLogs = this.callLogs.slice(-1000);
    }

    // Save to file
    this.saveLogsToFile();
  }

  /**
   * Save logs to file
   */
  saveLogsToFile() {
    try {
      const logDir = path.dirname(this.config.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.writeFileSync(this.config.logFile, JSON.stringify(this.callLogs, null, 2));
    } catch (error) {
      console.error('❌ Failed to save logs to file:', error.message);
    }
  }

  /**
   * Generate call statistics
   * @returns {Object} Call statistics
   */
  generateStats() {
    const stats = {
      total: this.callLogs.length,
      completed: 0,
      failed: 0,
      answered: 0,
      voicemail: 0,
      noAnswer: 0,
      scheduledMeetings: 0,
      optedOut: 0,
      totalDuration: 0,
      averageDuration: 0
    };

    for (const log of this.callLogs) {
      if (log.status === 'completed') stats.completed++;
      if (log.status === 'failed') stats.failed++;
      if (log.outcome === 'answered') stats.answered++;
      if (log.outcome === 'voicemail') stats.voicemail++;
      if (log.outcome === 'no-answer') stats.noAnswer++;
      if (log.userChoice === '1') stats.scheduledMeetings++;
      if (log.userChoice === '2' || log.action === 'opted_out') stats.optedOut++;
      if (log.duration) stats.totalDuration += log.duration;
    }

    if (stats.completed > 0) {
      stats.averageDuration = Math.round(stats.totalDuration / stats.completed);
    }

    stats.answerRate = stats.total > 0 ? ((stats.answered / stats.total) * 100).toFixed(2) : 0;
    stats.conversionRate = stats.answered > 0 ? ((stats.scheduledMeetings / stats.answered) * 100).toFixed(2) : 0;

    return stats;
  }

  /**
   * Start the webhook server
   * @returns {Promise} Server start promise
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, () => {
          console.log(`🎣 Webhook server listening on port ${this.config.port}`);
          console.log(`📡 Webhook URL: http://localhost:${this.config.port}/webhook`);
          resolve(this.server);
        });

        this.server.on('error', (error) => {
          console.error('❌ Webhook server error:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the webhook server
   * @returns {Promise} Server stop promise
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 Webhook server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

/**
 * Start webhook server with default configuration
 * @param {Object} config - Server configuration
 * @returns {Promise<WebhookServer>} Started server instance
 */
export async function startWebhookServer(config = {}) {
  const server = new WebhookServer(config);
  await server.start();
  return server;
}

export default {
  WebhookServer,
  startWebhookServer
};