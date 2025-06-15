/**
 * Email Service Module
 * Handles Mailgun integration for sending emails
 */

import Mailgun from 'mailgun.js';
import formData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service class for Mailgun integration
 */
export class EmailService {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.MAILGUN_API_KEY,
      domain: config.domain || process.env.MAILGUN_DOMAIN,
      baseUrl: config.baseUrl || process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net',
      from: config.from || process.env.DEFAULT_FROM_EMAIL,
      fromName: config.fromName || process.env.DEFAULT_FROM_NAME,
      replyTo: config.replyTo || process.env.DEFAULT_REPLY_TO,
      ...config
    };

    if (!this.config.apiKey) {
      throw new Error('Mailgun API key is required');
    }

    if (!this.config.domain) {
      throw new Error('Mailgun domain is required');
    }

    // Use provided client for testing, otherwise create new Mailgun client
    if (config.client) {
      this.client = config.client;
    } else {
      const mailgun = new Mailgun(formData);
      this.client = mailgun.client({
        username: 'api',
        key: this.config.apiKey,
        url: this.config.baseUrl
      });
    }
  }

  /**
   * Validate email address format
   * @param {string} email - Email address to validate
   * @returns {boolean} True if email format is valid
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validate email data completeness
   * @param {Object} emailData - Email data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateEmailData(emailData) {
    const errors = [];

    if (!emailData.to || !this.isValidEmail(emailData.to)) {
      errors.push('Valid recipient email address is required');
    }

    if (!emailData.subject || emailData.subject.trim() === '') {
      errors.push('Email subject is required');
    }

    if (!emailData.body || emailData.body.trim() === '') {
      errors.push('Email body is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create Mailgun message object from email data
   * @param {Object} emailData - Email data
   * @returns {Object} Mailgun message object
   */
  createMessage(emailData) {
    const message = {
      to: emailData.to,
      subject: emailData.subject,
      from: emailData.fromName && emailData.from 
        ? `${emailData.fromName} <${emailData.from}>`
        : emailData.from || `${this.config.fromName} <${this.config.from}>`
    };

    // Handle HTML vs text content
    if (emailData.isHtml !== false) {
      message.html = emailData.body;
      if (emailData.textBody) {
        message.text = emailData.textBody;
      }
    } else {
      message.text = emailData.body;
    }

    // Add reply-to if specified
    if (emailData.replyTo || this.config.replyTo) {
      message['h:Reply-To'] = emailData.replyTo || this.config.replyTo;
    }

    // Add tracking options
    if (emailData.tracking) {
      if (emailData.tracking.opens) {
        message['o:tracking-opens'] = 'yes';
      }
      if (emailData.tracking.clicks) {
        message['o:tracking-clicks'] = 'yes';
      }
    }

    // Add custom headers
    if (emailData.headers) {
      for (const [key, value] of Object.entries(emailData.headers)) {
        message[`h:${key}`] = value;
      }
    }

    // Add tags for tracking
    if (emailData.tags) {
      message['o:tag'] = Array.isArray(emailData.tags) ? emailData.tags : [emailData.tags];
    }

    return message;
  }

  /**
   * Send single email with retry logic
   * @param {Object} emailData - Email data
   * @param {Object} options - Send options
   * @returns {Promise<Object>} Send result
   */
  async sendSingle(emailData, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const message = this.createMessage(emailData);
        const response = await this.client.messages.create(this.config.domain, message);

        return {
          success: true,
          messageId: response.id,
          message: response.message,
          attempt,
          emailData
        };
      } catch (error) {
        lastError = error;

        // Don't retry for certain errors
        if (error.status === 400 || error.status === 401 || error.status === 403) {
          break;
        }

        // Retry for rate limiting and server errors
        if (attempt < maxRetries && (error.status === 429 || error.status >= 500)) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }

        break;
      }
    }

    return {
      success: false,
      error: lastError.message,
      status: lastError.status,
      attempts: maxRetries,
      emailData
    };
  }
}

/**
 * Send single email
 * @param {Object} emailData - Email data
 * @param {Object} options - Send options
 * @returns {Promise<Object>} Send result
 */
export async function sendEmail(emailData, options = {}) {
  try {
    // Handle dry run mode
    if (options.dryRun) {
      return {
        success: true,
        dryRun: true,
        message: 'Email would be sent (dry run mode)',
        emailData
      };
    }

    const emailService = new EmailService(options);

    // Validate email data
    const validation = emailService.validateEmailData(emailData);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Email validation failed: ${validation.errors.join(', ')}`,
        emailData
      };
    }

    return await emailService.sendSingle(emailData, options);
  } catch (error) {
    return {
      success: false,
      error: `Email service error: ${error.message}`,
      emailData
    };
  }
}

/**
 * Send batch of emails with rate limiting
 * @param {Array} emailBatch - Array of email data objects
 * @param {Object} options - Batch send options
 * @returns {Promise<Object>} Batch send results
 */
export async function sendBatchEmails(emailBatch, options = {}) {
  const batchSize = options.batchSize || parseInt(process.env.BATCH_SIZE) || 300;
  const delay = options.delay || parseInt(process.env.BATCH_DELAY_MS) || 1000;
  const results = [];
  let successful = 0;
  let failed = 0;
  let batches = 0;

  try {
    for (let i = 0; i < emailBatch.length; i += batchSize) {
      const batch = emailBatch.slice(i, i + batchSize);
      batches++;

      console.log(`Processing batch ${batches}: ${batch.length} emails (${i + 1}-${Math.min(i + batchSize, emailBatch.length)} of ${emailBatch.length})`);

      // Process batch in parallel
      const batchPromises = batch.map(async (emailData, index) => {
        try {
          const result = await sendEmail(emailData, options);
          
          if (result.success) {
            successful++;
          } else {
            failed++;
          }

          return {
            ...result,
            batchIndex: batches,
            emailIndex: i + index + 1,
            leadData: emailData.leadData
          };
        } catch (error) {
          failed++;
          return {
            success: false,
            error: error.message,
            batchIndex: batches,
            emailIndex: i + index + 1,
            emailData,
            leadData: emailData.leadData
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < emailBatch.length && delay > 0) {
        console.log(`Waiting ${delay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      successful,
      failed,
      total: emailBatch.length,
      batches,
      results,
      successRate: emailBatch.length > 0 ? (successful / emailBatch.length * 100).toFixed(2) : 0
    };
  } catch (error) {
    throw new Error(`Batch email sending failed: ${error.message}`);
  }
}

/**
 * Create email data from personalized template and lead
 * @param {Object} personalizedEmail - Personalized email content
 * @param {Object} leadData - Lead information
 * @param {Object} senderInfo - Sender information
 * @param {Object} options - Email options
 * @returns {Object} Email data ready for sending
 */
export function createEmailFromTemplate(personalizedEmail, leadData, senderInfo = {}, options = {}) {
  const emails = leadData.emails;
  if (!emails || !emails.primary) {
    throw new Error('No valid email address found for lead');
  }

  return {
    to: emails.primary,
    subject: personalizedEmail.subject,
    body: personalizedEmail.body,
    from: senderInfo.email || options.from,
    fromName: senderInfo.name || options.fromName,
    replyTo: senderInfo.replyTo || options.replyTo,
    isHtml: true,
    tracking: {
      opens: options.trackOpens !== false,
      clicks: options.trackClicks !== false
    },
    tags: [
      'lead-generator',
      personalizedEmail.template || 'unknown-template',
      emails.type || 'unknown-type'
    ],
    headers: {
      'X-Lead-Name': `${leadData.FirstName} ${leadData.LastName || ''}`.trim(),
      'X-Lead-Company': leadData.Company || 'Unknown',
      'X-Template-ID': personalizedEmail.template || 'unknown'
    },
    leadData // Include lead data for tracking
  };
}

/**
 * Get email sending statistics
 * @param {Array} sendResults - Array of send results
 * @returns {Object} Statistics object
 */
export function getEmailStats(sendResults) {
  const stats = {
    total: sendResults.length,
    successful: 0,
    failed: 0,
    retries: 0,
    rateLimited: 0,
    invalidEmails: 0,
    templates: new Set(),
    emailTypes: { work: 0, personal: 0 }
  };

  for (const result of sendResults) {
    if (result.success) {
      stats.successful++;
      
      if (result.attempt > 1) {
        stats.retries++;
      }
    } else {
      stats.failed++;
      
      if (result.error?.includes('Rate limit')) {
        stats.rateLimited++;
      }
      
      if (result.error?.includes('validation failed')) {
        stats.invalidEmails++;
      }
    }

    // Track template usage
    if (result.leadData?.emails?.template) {
      stats.templates.add(result.leadData.emails.template);
    }

    // Track email types
    if (result.leadData?.emails?.type) {
      stats.emailTypes[result.leadData.emails.type]++;
    }
  }

  stats.successRate = stats.total > 0 ? (stats.successful / stats.total * 100).toFixed(2) : 0;
  stats.retryRate = stats.successful > 0 ? (stats.retries / stats.successful * 100).toFixed(2) : 0;

  return stats;
}

/**
 * Validate Mailgun configuration
 * @param {Object} config - Mailgun configuration
 * @returns {Object} Validation result
 */
export function validateMailgunConfig(config = {}) {
  const errors = [];

  if (!config.apiKey && !process.env.MAILGUN_API_KEY) {
    errors.push('Mailgun API key is required');
  }

  if (!config.domain && !process.env.MAILGUN_DOMAIN) {
    errors.push('Mailgun domain is required');
  }

  if (!config.from && !process.env.DEFAULT_FROM_EMAIL) {
    errors.push('Default from email is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  EmailService,
  sendEmail,
  sendBatchEmails,
  createEmailFromTemplate,
  getEmailStats,
  validateMailgunConfig
};