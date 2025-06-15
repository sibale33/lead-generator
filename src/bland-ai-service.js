/**
 * Bland.ai Service Module
 * Handles Bland.ai integration for automated voice calling
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {
  getRandomVoiceTemplate,
  getVoiceTemplateById,
  personalizeVoiceScript
} from './voice-templates/index.js';

dotenv.config();

/**
 * Bland.ai Service class for voice calling integration
 */
export class BlandAIService {
  constructor(config = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.BLAND_AI_API_KEY,
      phoneNumber: config.phoneNumber || process.env.BLAND_AI_PHONE_NUMBER,
      baseUrl: config.baseUrl || process.env.BLAND_AI_BASE_URL || 'https://api.bland.ai',
      webhookUrl: config.webhookUrl || process.env.VOICE_WEBHOOK_URL,
      companyName: config.companyName || process.env.COMPANY_NAME || 'Our Company',
      callerName: config.callerName || process.env.CALLER_NAME || 'Sales Representative',
      calendlyLink: config.calendlyLink || process.env.CALENDLY_LINK,
      callHoursStart: config.callHoursStart || process.env.CALL_HOURS_START || '09:00',
      callHoursEnd: config.callHoursEnd || process.env.CALL_HOURS_END || '17:00',
      timezone: config.timezone || process.env.CALL_TIMEZONE || 'America/New_York',
      maxAttempts: config.maxAttempts || parseInt(process.env.MAX_CALL_ATTEMPTS) || 3,
      retryDelayHours: config.retryDelayHours || parseInt(process.env.CALL_RETRY_DELAY_HOURS) || 24,
      ...config
    };

    if (!this.config.apiKey) {
      throw new Error('Bland.ai API key is required');
    }

    if (!this.config.phoneNumber) {
      throw new Error('Bland.ai phone number is required');
    }

    // Initialize call tracking
    this.activeCalls = new Map();
    this.callHistory = [];
    this.doNotCallList = new Set();
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if phone number is valid
   */
  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }

    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d\+]/g, '');
    
    // Check for valid formats: +1234567890, 1234567890, or 234567890
    const phoneRegex = /^(\+?1?)?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Format phone number for Bland.ai API
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;

    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d\+]/g, '');
    
    // Add +1 for US numbers if not present
    if (cleaned.length === 10 && !cleaned.startsWith('+')) {
      return `+1${cleaned}`;
    }
    
    if (cleaned.length === 11 && cleaned.startsWith('1') && !cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  /**
   * Create personalized voice script for contact using template system
   * @param {Object} contact - Contact information
   * @param {Object} options - Script options (templateId, etc.)
   * @returns {string} Voice script
   */
  createVoiceScript(contact, options = {}) {
    try {
      // Get template - use specified template or random one
      let template;
      if (options.templateId) {
        template = getVoiceTemplateById(options.templateId);
        if (!template) {
          console.warn(`Template ${options.templateId} not found, using random template`);
          template = getRandomVoiceTemplate();
        }
      } else {
        template = getRandomVoiceTemplate();
      }

      // Create config object for personalization
      const config = {
        callerName: this.config.callerName,
        companyName: this.config.companyName,
        calendlyLink: this.config.calendlyLink
      };

      // Personalize the script
      const personalizedScript = personalizeVoiceScript(template, contact, config);
      
      return personalizedScript;
    } catch (error) {
      console.error('Error creating voice script:', error);
      // Fallback to simple script if template system fails
      const firstName = contact.Name?.split(' ')[0] || 'there';
      return `Hello ${firstName}, this is ${this.config.callerName} calling from ${this.config.companyName}.

I'm an AI assistant reaching out about potential opportunities that might interest you. This call will take just a moment.

If you'd like me to send you a link to schedule a brief conversation with our team, please press 1 on your keypad.

If you'd prefer not to receive future calls from us, please press 2 and we'll remove you from our calling list.

Thank you for your time, ${firstName}.`;
    }
  }

  /**
   * Check if current time is within allowed call hours (9 AM - 5 PM, Monday-Friday)
   * @param {Date} testDate - Optional date for testing (defaults to current time)
   * @returns {boolean} True if within business call hours
   */
  isWithinCallHours(testDate = null) {
    try {
      const now = testDate || new Date();
      const timeZone = this.config.timezone;
      
      // Get current day of week and time in the specified timezone
      const currentDateTime = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long'
      }).formatToParts(now);

      // Extract parts
      const dayOfWeek = currentDateTime.find(part => part.type === 'weekday')?.value;
      const hour = parseInt(currentDateTime.find(part => part.type === 'hour')?.value);
      const minute = parseInt(currentDateTime.find(part => part.type === 'minute')?.value);

      // Check if it's a weekday (Monday-Friday)
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      if (!weekdays.includes(dayOfWeek)) {
        return false; // No calls on weekends
      }

      // Convert current time to minutes since midnight
      const currentMinutes = hour * 60 + minute;

      // Parse configured call hours (default: 9 AM - 5 PM)
      const [startHour, startMinute] = this.config.callHoursStart.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;

      const [endHour, endMinute] = this.config.callHoursEnd.split(':').map(Number);
      const endMinutes = endHour * 60 + endMinute;

      // Check if current time is within business hours
      const withinHours = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

      if (!withinHours) {
        console.log(`🕐 Outside business hours: Current time is ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${dayOfWeek} (${timeZone}), business hours are ${this.config.callHoursStart}-${this.config.callHoursEnd} Monday-Friday`);
      }

      return withinHours;
    } catch (error) {
      console.warn('Error checking call hours:', error.message);
      return false; // Default to NOT allowing calls if time check fails (safer approach)
    }
  }

  /**
   * Check if phone number is on do-not-call list
   * @param {string} phoneNumber - Phone number to check
   * @param {Array} doNotCallList - List of numbers to avoid
   * @returns {boolean} True if on do-not-call list
   */
  isOnDoNotCallList(phoneNumber, doNotCallList = []) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return doNotCallList.includes(formatted) || this.doNotCallList.has(formatted);
  }

  /**
   * Make a voice call using Bland.ai API
   * @param {Object} contact - Contact information
   * @param {Object} options - Call options
   * @returns {Promise<Object>} Call result
   */
  async makeCall(contact, options = {}) {
    try {
      // Handle dry run mode
      if (options.dryRun || process.env.VOICE_DRY_RUN === 'true') {
        return {
          success: true,
          dryRun: true,
          message: 'Voice call simulation - not actually made',
          contact,
          callId: `dry-run-${Date.now()}`,
          status: 'simulated'
        };
      }

      // Validate contact data
      if (!contact.Name) {
        return {
          success: false,
          error: 'Contact name is required',
          contact
        };
      }

      if (!this.isValidPhoneNumber(contact.PhoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format',
          contact
        };
      }

      // Check compliance
      if (!this.isWithinCallHours()) {
        return {
          success: false,
          error: 'Outside of allowed call hours',
          contact
        };
      }

      if (this.isOnDoNotCallList(contact.PhoneNumber, options.doNotCallList)) {
        return {
          success: false,
          error: 'Phone number is on do-not-call list',
          contact
        };
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(contact.PhoneNumber);
      
      // Create voice script using template system
      const script = this.createVoiceScript(contact, options);

      // Prepare API request
      const requestBody = {
        phone_number: formattedPhone,
        from: this.config.phoneNumber,
        task: script,
        voice: 'maya', // Default Bland.ai voice
        language: 'en',
        webhook: this.config.webhookUrl,
        wait_for_greeting: true,
        record: true,
        interruption_threshold: 100,
        max_duration: 300, // 5 minutes max
        answered_by_enabled: true,
        metadata: {
          contact_name: contact.Name,
          contact_email: contact.Email || '',
          campaign_id: options.campaignId || 'default',
          timestamp: new Date().toISOString()
        }
      };

      // Make API call to Bland.ai
      const response = await fetch(`${this.config.baseUrl}/v1/calls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `Bland.ai API error: ${responseData.error || response.statusText}`,
          status: response.status,
          contact
        };
      }

      // Track active call
      const callResult = {
        success: true,
        callId: responseData.call_id,
        status: responseData.status || 'queued',
        message: responseData.message || 'Call initiated successfully',
        contact,
        timestamp: new Date().toISOString(),
        phoneNumber: formattedPhone
      };

      this.activeCalls.set(responseData.call_id, callResult);

      return callResult;

    } catch (error) {
      return {
        success: false,
        error: `Call failed: ${error.message}`,
        contact
      };
    }
  }

  /**
   * Get call status from Bland.ai API
   * @param {string} callId - Call ID to check
   * @returns {Promise<Object>} Call status
   */
  async getCallStatus(callId) {
    try {
      const response = await fetch(`${this.config.baseUrl}/v1/calls/${callId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to get call status: ${responseData.error || response.statusText}`,
          callId
        };
      }

      return {
        success: true,
        callId,
        status: responseData.status,
        duration: responseData.duration,
        outcome: responseData.outcome,
        transcript: responseData.transcript,
        userInput: responseData.user_input,
        ...responseData
      };

    } catch (error) {
      return {
        success: false,
        error: `Status check failed: ${error.message}`,
        callId
      };
    }
  }

  /**
   * Process webhook data from Bland.ai
   * @param {Object} webhookData - Webhook payload
   * @returns {Object} Processed webhook data
   */
  processWebhookData(webhookData) {
    try {
      if (!webhookData.call_id) {
        return {
          error: 'Invalid webhook data: missing call_id'
        };
      }

      const processed = {
        callId: webhookData.call_id,
        status: webhookData.status,
        duration: webhookData.duration,
        outcome: webhookData.outcome,
        transcript: webhookData.transcript,
        userChoice: webhookData.user_input,
        timestamp: new Date().toISOString(),
        rawData: webhookData
      };

      // Update active call tracking
      if (this.activeCalls.has(webhookData.call_id)) {
        const callData = this.activeCalls.get(webhookData.call_id);
        Object.assign(callData, processed);
        
        // Move to history if call is completed
        if (['completed', 'failed', 'no-answer'].includes(webhookData.status)) {
          this.callHistory.push(callData);
          this.activeCalls.delete(webhookData.call_id);
        }
      }

      return processed;

    } catch (error) {
      return {
        error: `Webhook processing failed: ${error.message}`,
        rawData: webhookData
      };
    }
  }

  /**
   * Add phone number to do-not-call list
   * @param {string} phoneNumber - Phone number to add
   */
  addToDoNotCallList(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    this.doNotCallList.add(formatted);
  }

  /**
   * Get call statistics
   * @returns {Object} Call statistics
   */
  getCallStats() {
    const allCalls = [...this.activeCalls.values(), ...this.callHistory];
    
    const stats = {
      total: allCalls.length,
      active: this.activeCalls.size,
      completed: 0,
      failed: 0,
      answered: 0,
      voicemail: 0,
      optedOut: 0,
      scheduledMeetings: 0,
      totalDuration: 0
    };

    for (const call of allCalls) {
      if (call.status === 'completed') stats.completed++;
      if (call.status === 'failed') stats.failed++;
      if (call.outcome === 'answered') stats.answered++;
      if (call.outcome === 'voicemail') stats.voicemail++;
      if (call.userChoice === '2') stats.optedOut++;
      if (call.userChoice === '1') stats.scheduledMeetings++;
      if (call.duration) stats.totalDuration += call.duration;
    }

    stats.averageDuration = stats.completed > 0 ? Math.round(stats.totalDuration / stats.completed) : 0;
    stats.answerRate = stats.total > 0 ? ((stats.answered / stats.total) * 100).toFixed(2) : 0;
    stats.conversionRate = stats.answered > 0 ? ((stats.scheduledMeetings / stats.answered) * 100).toFixed(2) : 0;

    return stats;
  }
}

/**
 * Make single voice call
 * @param {Object} contact - Contact information
 * @param {Object} options - Call options
 * @returns {Promise<Object>} Call result
 */
export async function makeVoiceCall(contact, options = {}) {
  const blandAIService = new BlandAIService(options);
  return await blandAIService.makeCall(contact, options);
}

/**
 * Start call campaign for multiple contacts
 * @param {Array} contacts - Array of contact objects
 * @param {Object} options - Campaign options
 * @returns {Promise<Object>} Campaign results
 */
export async function startCallCampaign(contacts, options = {}) {
  const blandAIService = new BlandAIService(options);
  const delay = options.delay || 5000; // 5 second delay between calls
  const results = [];
  let successful = 0;
  let failed = 0;

  console.log(`📞 Starting voice campaign for ${contacts.length} contacts...`);

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    
    try {
      console.log(`📞 Calling ${contact.Name} (${i + 1}/${contacts.length})...`);
      
      const result = await blandAIService.makeCall(contact, {
        ...options,
        campaignId: options.campaignId || `campaign-${Date.now()}`
      });

      if (result.success) {
        successful++;
        console.log(`✅ Call initiated for ${contact.Name} - Call ID: ${result.callId}`);
      } else {
        failed++;
        console.log(`❌ Call failed for ${contact.Name}: ${result.error}`);
      }

      results.push({
        ...result,
        contactIndex: i + 1
      });

      // Add delay between calls (except for last call)
      if (i < contacts.length - 1 && delay > 0) {
        console.log(`⏳ Waiting ${delay}ms before next call...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (error) {
      failed++;
      const errorResult = {
        success: false,
        error: error.message,
        contact,
        contactIndex: i + 1
      };
      results.push(errorResult);
      console.log(`❌ Call failed for ${contact.Name}: ${error.message}`);
    }
  }

  const campaignResults = {
    successful,
    failed,
    total: contacts.length,
    results,
    successRate: contacts.length > 0 ? ((successful / contacts.length) * 100).toFixed(2) : 0,
    timestamp: new Date().toISOString(),
    campaignId: options.campaignId || `campaign-${Date.now()}`
  };

  console.log(`📊 Campaign completed: ${successful} successful, ${failed} failed`);

  return campaignResults;
}

/**
 * Save campaign results to file
 * @param {Object} campaignResults - Campaign results to save
 * @param {string} filePath - File path to save results
 */
export function saveCampaignResults(campaignResults, filePath) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(campaignResults, null, 2));
    console.log(`💾 Campaign results saved to: ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to save campaign results: ${error.message}`);
  }
}

export default {
  BlandAIService,
  makeVoiceCall,
  startCallCampaign,
  saveCampaignResults
};