/**
 * @profullstack/lead-generator - Main module export
 * Lead generation tool for mass email campaigns with AI personalization
 */

// Core modules
export { 
  parseCSV, 
  validateLeadData, 
  extractEmails, 
  processLeadsFromCSV, 
  getLeadStats 
} from './src/csv-parser.js';

export { 
  AIService, 
  personalizeTemplate, 
  generatePlaceholderValues, 
  batchPersonalize, 
  getPersonalizationStats 
} from './src/ai-service.js';

export { 
  EmailService, 
  sendEmail, 
  sendBatchEmails, 
  createEmailFromTemplate, 
  getEmailStats, 
  validateMailgunConfig 
} from './src/email-service.js';

export { 
  VoiceService, 
  makeVoiceCall, 
  emailToVoiceScript, 
  isValidPhoneNumber, 
  formatPhoneNumber, 
  getVoiceServiceStatus 
} from './src/voice-service.js';

// Templates
export { 
  templates, 
  templatesByCategory, 
  templatesByTone, 
  getTemplateById, 
  getTemplatesByCategory, 
  getTemplatesByTone, 
  getRandomTemplate, 
  getAllTemplateIds, 
  getAllCategories, 
  getAllTones 
} from './src/email-templates/index.js';

/**
 * Lead Generator class - Main orchestrator
 */
export class LeadGenerator {
  constructor(config = {}) {
    this.config = {
      // Mailgun configuration
      mailgun: {
        apiKey: config.mailgunApiKey || process.env.MAILGUN_API_KEY,
        domain: config.mailgunDomain || process.env.MAILGUN_DOMAIN,
        baseUrl: config.mailgunBaseUrl || process.env.MAILGUN_BASE_URL
      },
      
      // OpenAI configuration
      openai: {
        apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY,
        model: config.openaiModel || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        maxTokens: config.openaiMaxTokens || parseInt(process.env.OPENAI_MAX_TOKENS) || 500,
        temperature: config.openaiTemperature || parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
      },
      
      // Sender information
      sender: {
        name: config.senderName || process.env.DEFAULT_FROM_NAME,
        email: config.senderEmail || process.env.DEFAULT_FROM_EMAIL,
        title: config.senderTitle || 'Sales Director',
        replyTo: config.replyTo || process.env.DEFAULT_REPLY_TO
      },
      
      // Campaign settings
      campaign: {
        batchSize: config.batchSize || parseInt(process.env.BATCH_SIZE) || 300,
        delay: config.delay || parseInt(process.env.BATCH_DELAY_MS) || 1000,
        maxRetries: config.maxRetries || parseInt(process.env.MAX_RETRIES) || 3,
        enablePersonalization: config.enablePersonalization !== false,
        trackOpens: config.trackOpens !== false,
        trackClicks: config.trackClicks !== false
      },
      
      ...config
    };
  }

  /**
   * Run complete lead generation campaign
   * @param {string} csvFilePath - Path to CSV file with leads
   * @param {Object} options - Campaign options
   * @returns {Promise<Object>} Campaign results
   */
  async runCampaign(csvFilePath, options = {}) {
    const campaignOptions = { ...this.config.campaign, ...options };
    const results = {
      timestamp: new Date().toISOString(),
      csvFile: csvFilePath,
      config: campaignOptions
    };

    try {
      // Step 1: Process CSV file
      console.log('📄 Processing CSV file...');
      const csvResults = await processLeadsFromCSV(csvFilePath);
      results.csvProcessing = csvResults;

      if (csvResults.validLeads.length === 0) {
        throw new Error('No valid leads found in CSV file');
      }

      // Step 2: Select templates
      let selectedTemplates = options.templates || templates;
      if (options.templateId) {
        const template = getTemplateById(options.templateId);
        if (!template) {
          throw new Error(`Template not found: ${options.templateId}`);
        }
        selectedTemplates = [template];
      }

      // Step 3: Personalize emails
      console.log('🤖 Personalizing emails...');
      const personalizationResults = await batchPersonalize(
        selectedTemplates,
        csvResults.validLeads,
        this.config.sender,
        {
          ...this.config.openai,
          fallbackToBasic: true,
          batchSize: 10,
          delay: 500
        }
      );
      results.personalization = getPersonalizationStats(personalizationResults);

      // Step 4: Create email data
      const emailsToSend = personalizationResults
        .filter(r => r.success)
        .map(result => createEmailFromTemplate(
          result.email,
          result.lead,
          this.config.sender,
          {
            trackOpens: campaignOptions.trackOpens,
            trackClicks: campaignOptions.trackClicks
          }
        ));

      // Step 5: Send emails
      console.log('📧 Sending emails...');
      const sendResults = await sendBatchEmails(emailsToSend, {
        ...this.config.mailgun,
        batchSize: campaignOptions.batchSize,
        delay: campaignOptions.delay,
        maxRetries: campaignOptions.maxRetries,
        dryRun: campaignOptions.dryRun
      });
      results.sending = sendResults;

      // Step 6: Generate final statistics
      results.summary = {
        totalLeads: csvResults.stats.total,
        validLeads: csvResults.stats.valid,
        emailsSent: sendResults.successful,
        emailsFailed: sendResults.failed,
        successRate: sendResults.successRate,
        personalizationRate: results.personalization.aiEnhancementRate
      };

      return results;

    } catch (error) {
      results.error = error.message;
      throw error;
    }
  }

  /**
   * Validate configuration
   * @returns {Object} Validation result
   */
  validateConfig() {
    const errors = [];

    // Check Mailgun config
    if (!this.config.mailgun.apiKey) {
      errors.push('Mailgun API key is required');
    }
    if (!this.config.mailgun.domain) {
      errors.push('Mailgun domain is required');
    }

    // Check sender config
    if (!this.config.sender.email) {
      errors.push('Sender email is required');
    }
    if (!this.config.sender.name) {
      errors.push('Sender name is required');
    }

    // OpenAI is optional but warn if personalization is enabled
    if (this.config.campaign.enablePersonalization && !this.config.openai.apiKey) {
      errors.push('OpenAI API key is required for AI personalization (or disable personalization)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Get available templates
   * @param {Object} filters - Template filters
   * @returns {Array} Filtered templates
   */
  getTemplates(filters = {}) {
    let filteredTemplates = templates;

    if (filters.category) {
      filteredTemplates = getTemplatesByCategory(filters.category);
    }
    if (filters.tone) {
      filteredTemplates = getTemplatesByTone(filters.tone);
    }

    return filteredTemplates;
  }

  /**
   * Preview personalized email
   * @param {string} templateId - Template ID
   * @param {Object} leadData - Sample lead data
   * @returns {Promise<Object>} Personalized email preview
   */
  async previewEmail(templateId, leadData) {
    const template = getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return await personalizeTemplate(
      template,
      leadData,
      this.config.sender,
      {
        ...this.config.openai,
        fallbackToBasic: true
      }
    );
  }
}

/**
 * Quick start function for simple campaigns
 * @param {string} csvFilePath - Path to CSV file
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Campaign results
 */
export async function quickStart(csvFilePath, config = {}) {
  const generator = new LeadGenerator(config);
  
  // Validate configuration
  const validation = generator.validateConfig();
  if (!validation.isValid) {
    throw new Error(`Configuration invalid: ${validation.errors.join(', ')}`);
  }

  return await generator.runCampaign(csvFilePath, config);
}

/**
 * Utility function to create sample CSV
 * @param {string} filePath - Output file path
 * @param {number} count - Number of sample leads
 */
export function createSampleCSV(filePath, count = 5) {
  const sampleData = [
    'FirstName,LastName,Company,WorkEmail,PersonalEmail,Phone,Industry,Title',
    'John,Doe,Acme Corp,john.doe@acme.com,john@personal.com,555-0123,Technology,CTO',
    'Jane,Smith,Beta Inc,jane.smith@beta.com,,555-0456,Healthcare,VP Engineering',
    'Bob,Johnson,Gamma LLC,,bob@gmail.com,555-0789,Finance,Director',
    'Alice,Williams,Delta Co,alice@delta.co,alice.w@email.com,555-0321,Marketing,Manager',
    'Charlie,Brown,Echo Ltd,charlie.brown@echo.ltd,,555-0654,Consulting,Partner'
  ];

  const csvContent = sampleData.slice(0, count + 1).join('\n');
  
  import('fs').then(fs => {
    fs.writeFileSync(filePath, csvContent);
    console.log(`Sample CSV created: ${filePath}`);
  });
}

// Default export
export default {
  LeadGenerator,
  quickStart,
  createSampleCSV,
  templates,
  getTemplateById,
  getAllTemplateIds
};