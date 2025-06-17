/**
 * SMS Template Manager - Central registry for all SMS templates
 */

import { smsTemplate01 } from './sms-template-01-expansion.js';
import { smsTemplate02 } from './sms-template-02-problem-solver.js';
import { smsTemplate03 } from './sms-template-03-social-proof.js';
import { smsTemplate04 } from './sms-template-04-direct.js';
import { smsTemplate05 } from './sms-template-05-urgency.js';

/**
 * All available SMS templates
 */
export const smsTemplates = [
  smsTemplate01,
  smsTemplate02,
  smsTemplate03,
  smsTemplate04,
  smsTemplate05
];

/**
 * SMS templates organized by category
 */
export const smsTemplatesByCategory = {
  growth: [smsTemplate01],
  solution: [smsTemplate02],
  'social-proof': [smsTemplate03],
  direct: [smsTemplate04],
  urgency: [smsTemplate05]
};

/**
 * SMS templates organized by tone
 */
export const smsTemplatesByTone = {
  professional: [smsTemplate01],
  consultative: [smsTemplate02],
  confident: [smsTemplate03],
  straightforward: [smsTemplate04],
  urgent: [smsTemplate05]
};

/**
 * Get SMS template by ID
 * @param {string} id - Template ID
 * @returns {Object|null} Template object or null if not found
 */
export function getSmsTemplateById(id) {
  return smsTemplates.find(template => template.id === id) || null;
}

/**
 * Get SMS templates by category
 * @param {string} category - Template category
 * @returns {Array} Array of templates in the category
 */
export function getSmsTemplatesByCategory(category) {
  return smsTemplatesByCategory[category] || [];
}

/**
 * Get SMS templates by tone
 * @param {string} tone - Template tone
 * @returns {Array} Array of templates with the specified tone
 */
export function getSmsTemplatesByTone(tone) {
  return smsTemplatesByTone[tone] || [];
}

/**
 * Get a random SMS template
 * @returns {Object} Random template
 */
export function getRandomSmsTemplate() {
  const randomIndex = Math.floor(Math.random() * smsTemplates.length);
  return smsTemplates[randomIndex];
}

/**
 * Get all SMS template IDs
 * @returns {Array} Array of template IDs
 */
export function getAllSmsTemplateIds() {
  return smsTemplates.map(template => template.id);
}

/**
 * Get all SMS template categories
 * @returns {Array} Array of unique categories
 */
export function getAllSmsCategories() {
  return Object.keys(smsTemplatesByCategory);
}

/**
 * Get all SMS template tones
 * @returns {Array} Array of unique tones
 */
export function getAllSmsTones() {
  return Object.keys(smsTemplatesByTone);
}

/**
 * Personalize SMS template with contact data
 * @param {Object} template - SMS template object
 * @param {Object} contactData - Contact information
 * @param {Object} senderInfo - Sender information
 * @param {Object} options - Personalization options
 * @returns {Object} Personalized SMS data
 */
export function personalizeSmsTemplate(template, contactData = {}, senderInfo = {}, options = {}) {
  if (!template) {
    throw new Error('Template is required for SMS personalization');
  }

  // Choose message based on character limit preference
  const useShortMessage = options.preferShort || false;
  let message = useShortMessage && template.shortMessage ? template.shortMessage : template.message;

  // Replace placeholders with actual data
  const placeholderData = {
    firstName: contactData.firstName || contactData.first_name || 'there',
    lastName: contactData.lastName || contactData.last_name || '',
    companyName: contactData.companyName || contactData.company_name || contactData.company || 'your company',
    industry: contactData.industry || 'business',
    painPoint: contactData.painPoint || 'operational challenges',
    similarCompany: contactData.similarCompany || 'a similar company',
    metric: contactData.metric || 'efficiency',
    percentage: contactData.percentage || '25',
    savings: contactData.savings || '$10k/month',
    service: contactData.service || 'operations',
    offer: contactData.offer || 'our consultation program',
    deadline: contactData.deadline || 'this week',
    senderName: senderInfo.name || senderInfo.firstName || 'Alex',
    senderCompany: senderInfo.company || senderInfo.companyName || 'our team'
  };

  // Replace placeholders in message
  for (const [key, value] of Object.entries(placeholderData)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    message = message.replace(placeholder, value);
  }

  // Check message length and truncate if necessary
  const maxLength = options.maxLength || template.metadata?.maxLength || 160;
  if (message.length > maxLength) {
    message = message.substring(0, maxLength - 3) + '...';
  }

  return {
    message,
    template: template.id,
    category: template.category,
    tone: template.tone,
    length: message.length,
    metadata: {
      ...template.metadata,
      personalizedAt: new Date().toISOString(),
      contactId: contactData.id || contactData.email || 'unknown'
    }
  };
}

export default {
  smsTemplates,
  smsTemplatesByCategory,
  smsTemplatesByTone,
  getSmsTemplateById,
  getSmsTemplatesByCategory,
  getSmsTemplatesByTone,
  getRandomSmsTemplate,
  getAllSmsTemplateIds,
  getAllSmsCategories,
  getAllSmsTones,
  personalizeSmsTemplate
};