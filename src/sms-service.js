/**
 * SMS Service - Handles SMS sending via Twilio
 * Provides batch SMS functionality with rate limiting and error handling
 */

import twilio from 'twilio';
import { updateCSVStatus, SMS_STATUS } from './csv-status-tracker.js';
import { personalizeSmsTemplate } from './sms-templates/index.js';

/**
 * SMS Service class for managing Twilio SMS operations
 */
export class SmsService {
  constructor(config = {}) {
    this.config = {
      accountSid: config.accountSid || process.env.TWILIO_ACCOUNT_SID,
      authToken: config.authToken || process.env.TWILIO_AUTH_TOKEN,
      fromNumber: config.fromNumber || process.env.TWILIO_FROM_NUMBER,
      dryRun: config.dryRun || false,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };

    this.validateConfig();
    
    if (!this.config.dryRun) {
      this.client = twilio(this.config.accountSid, this.config.authToken);
    }
  }

  /**
   * Validate required configuration
   */
  validateConfig() {
    if (!this.config.dryRun) {
      if (!this.config.accountSid) {
        throw new Error('Twilio Account SID is required');
      }
      if (!this.config.authToken) {
        throw new Error('Twilio Auth Token is required');
      }
      if (!this.config.fromNumber) {
        throw new Error('Twilio From Number is required');
      }
    }
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if valid
   */
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid length (10-15 digits)
    if (cleaned.length < 10 || cleaned.length > 15) return false;
    
    // Must start with country code or area code
    return /^(\+?1)?[2-9]\d{9}$/.test(phoneNumber) || /^\+\d{10,14}$/.test(phoneNumber) || /^[2-9]\d{9}$/.test(cleaned);
  }

  /**
   * Format phone number for Twilio
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    // Handle already formatted numbers
    if (phoneNumber.startsWith('+')) {
      return phoneNumber; // Return as-is if already properly formatted
    }
    
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assume US)
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    return '+' + cleaned;
  }

  /**
   * Validate SMS data before sending
   * @param {Object} smsData - SMS data to validate
   * @returns {Object} Validation result
   */
  validateSmsData(smsData) {
    const errors = [];

    if (!smsData.to) {
      errors.push('Recipient phone number is required');
    } else if (!this.validatePhoneNumber(smsData.to)) {
      errors.push('Invalid recipient phone number format');
    }

    if (!smsData.message) {
      errors.push('SMS message is required');
    } else if (smsData.message.length > 1600) {
      errors.push('SMS message too long (max 1600 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Send a single SMS
   * @param {Object} smsData - SMS data
   * @returns {Promise<Object>} Send result
   */
  async sendSms(smsData) {
    try {
      // Validate SMS data
      const validation = this.validateSmsData(smsData);
      if (!validation.isValid) {
        throw new Error(`SMS validation failed: ${validation.errors.join(', ')}`);
      }

      const formattedTo = this.formatPhoneNumber(smsData.to);
      const messageData = {
        body: smsData.message,
        from: this.config.fromNumber,
        to: formattedTo
      };

      if (this.config.dryRun) {
        console.log(`📱 [DRY RUN] Would send SMS to ${formattedTo}:`);
        console.log(`   Message: ${smsData.message.substring(0, 100)}${smsData.message.length > 100 ? '...' : ''}`);
        
        return {
          success: true,
          messageId: `dry-run-${Date.now()}`,
          to: formattedTo,
          message: smsData.message,
          cost: 0,
          dryRun: true
        };
      }

      // Send SMS via Twilio
      const message = await this.client.messages.create(messageData);

      return {
        success: true,
        messageId: message.sid,
        to: formattedTo,
        message: smsData.message,
        status: message.status,
        cost: message.price || 0,
        dryRun: false
      };

    } catch (error) {
      console.error(`❌ SMS sending failed:`, error.message);
      
      return {
        success: false,
        error: error.message,
        to: smsData.to,
        message: smsData.message,
        dryRun: this.config.dryRun
      };
    }
  }

  /**
   * Send SMS with retry logic
   * @param {Object} smsData - SMS data
   * @param {number} retryCount - Current retry count
   * @returns {Promise<Object>} Send result
   */
  async sendSmsWithRetry(smsData, retryCount = 0) {
    try {
      const result = await this.sendSms(smsData);
      
      if (!result.success && retryCount < this.config.maxRetries) {
        console.log(`🔄 Retrying SMS send (attempt ${retryCount + 1}/${this.config.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));
        return this.sendSmsWithRetry(smsData, retryCount + 1);
      }
      
      return result;
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        console.log(`🔄 Retrying SMS send due to error (attempt ${retryCount + 1}/${this.config.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));
        return this.sendSmsWithRetry(smsData, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Send batch SMS messages
   * @param {Array} smsDataArray - Array of SMS data objects
   * @param {Object} options - Batch options
   * @returns {Promise<Object>} Batch results
   */
  async sendBatchSms(smsDataArray, options = {}) {
    const {
      batchSize = 10,
      delayBetweenBatches = 1000,
      csvFile = null,
      onProgress = null
    } = options;

    const results = [];
    const stats = {
      total: smsDataArray.length,
      sent: 0,
      failed: 0,
      totalCost: 0,
      startTime: new Date(),
      endTime: null
    };

    console.log(`📱 Starting SMS batch send: ${stats.total} messages`);

    // Process in batches
    for (let i = 0; i < smsDataArray.length; i += batchSize) {
      const batch = smsDataArray.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(smsDataArray.length / batchSize);

      console.log(`Processing batch ${batchNumber}: ${batch.length} SMS messages (${i + 1}-${Math.min(i + batch.length, smsDataArray.length)} of ${smsDataArray.length})`);

      // Send batch concurrently
      const batchPromises = batch.map(async (smsData, index) => {
        try {
          const result = await this.sendSmsWithRetry(smsData);
          
          // Update CSV status if file provided
          if (csvFile && smsData.leadData) {
            const status = result.success ? SMS_STATUS.SENT : SMS_STATUS.FAILED;
            await updateCSVStatus(csvFile, smsData.leadData, { smsStatus: status });
          }

          // Update stats
          if (result.success) {
            stats.sent++;
            stats.totalCost += parseFloat(result.cost || 0);
          } else {
            stats.failed++;
          }

          // Call progress callback
          if (onProgress) {
            onProgress({
              current: i + index + 1,
              total: stats.total,
              result,
              stats: { ...stats }
            });
          }

          return result;
        } catch (error) {
          console.error(`❌ Batch SMS error for ${smsData.to}:`, error.message);
          stats.failed++;
          
          return {
            success: false,
            error: error.message,
            to: smsData.to,
            message: smsData.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches (except for last batch)
      if (i + batchSize < smsDataArray.length && delayBetweenBatches > 0) {
        console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    stats.endTime = new Date();
    stats.duration = stats.endTime - stats.startTime;

    console.log(`📊 SMS Batch Results:`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   Sent: ${stats.sent}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Success Rate: ${((stats.sent / stats.total) * 100).toFixed(1)}%`);
    console.log(`   Total Cost: $${stats.totalCost.toFixed(4)}`);
    console.log(`   Duration: ${(stats.duration / 1000).toFixed(1)}s`);

    return {
      results,
      stats,
      success: stats.failed === 0
    };
  }
}

/**
 * Create SMS from template
 * @param {Object} template - SMS template
 * @param {Object} leadData - Lead data
 * @param {Object} senderInfo - Sender information
 * @param {Object} options - Options
 * @returns {Object} SMS data ready to send
 */
export function createSmsFromTemplate(template, leadData, senderInfo = {}, options = {}) {
  const personalizedSms = personalizeSmsTemplate(template, leadData, senderInfo, options);
  
  return {
    to: leadData.phone || leadData.phoneNumber || leadData.mobile,
    message: personalizedSms.message,
    template: personalizedSms.template,
    leadData: leadData
  };
}

/**
 * Send batch SMS from templates
 * @param {Array} leads - Array of lead data
 * @param {Array} templates - Array of SMS templates
 * @param {Object} senderInfo - Sender information
 * @param {Object} options - Options
 * @returns {Promise<Object>} Batch results
 */
export async function sendBatchSmsFromTemplates(leads, templates, senderInfo = {}, options = {}) {
  const smsService = new SmsService(options.smsConfig || {});
  
  // Create SMS data from templates
  const smsDataArray = leads.map(lead => {
    // Select template (random or specified)
    const template = options.templateSelector 
      ? options.templateSelector(templates, lead)
      : templates[Math.floor(Math.random() * templates.length)];
    
    return createSmsFromTemplate(template, lead, senderInfo, options);
  }).filter(smsData => smsData.to); // Filter out leads without phone numbers

  if (smsDataArray.length === 0) {
    throw new Error('No valid phone numbers found in leads data');
  }

  return smsService.sendBatchSms(smsDataArray, options);
}

export default SmsService;