/**
 * Voice Template Manager - Central registry for all voice call templates
 */

import voiceTemplate01 from './voice-template-01-opener.js';
import voiceTemplate02 from './voice-template-02-problem-solver.js';
import voiceTemplate03 from './voice-template-03-social-proof.js';
import voiceTemplate04 from './voice-template-04-curiosity.js';
import voiceTemplate05 from './voice-template-05-direct.js';
import voiceTemplate06 from './voice-template-06-conversational.js';
import voiceTemplate07 from './voice-template-07-urgency.js';
import voiceTemplate08 from './voice-template-08-insight.js';
import voiceTemplate09 from './voice-template-09-referral.js';
import voiceTemplate10 from './voice-template-10-follow-up.js';

/**
 * All available voice call templates
 */
export const voiceTemplates = [
  voiceTemplate01,
  voiceTemplate02,
  voiceTemplate03,
  voiceTemplate04,
  voiceTemplate05,
  voiceTemplate06,
  voiceTemplate07,
  voiceTemplate08,
  voiceTemplate09,
  voiceTemplate10
];

/**
 * Voice templates organized by category
 */
export const voiceTemplatesByCategory = {
  opener: [voiceTemplate01],
  solution: [voiceTemplate02],
  'social-proof': [voiceTemplate03],
  curiosity: [voiceTemplate04],
  direct: [voiceTemplate05],
  engagement: [voiceTemplate06],
  urgency: [voiceTemplate07],
  insight: [voiceTemplate08],
  referral: [voiceTemplate09],
  'follow-up': [voiceTemplate10]
};

/**
 * Voice templates organized by tone
 */
export const voiceTemplatesByTone = {
  professional: [voiceTemplate01],
  consultative: [voiceTemplate02],
  confident: [voiceTemplate03],
  intriguing: [voiceTemplate04],
  straightforward: [voiceTemplate05],
  conversational: [voiceTemplate06],
  urgent: [voiceTemplate07],
  informative: [voiceTemplate08],
  warm: [voiceTemplate09],
  respectful: [voiceTemplate10]
};

/**
 * Get voice template by ID
 * @param {string} id - Template ID
 * @returns {Object|null} Template object or null if not found
 */
export function getVoiceTemplateById(id) {
  return voiceTemplates.find(template => template.id === id) || null;
}

/**
 * Get voice templates by category
 * @param {string} category - Template category
 * @returns {Array} Array of templates in the category
 */
export function getVoiceTemplatesByCategory(category) {
  return voiceTemplatesByCategory[category] || [];
}

/**
 * Get voice templates by tone
 * @param {string} tone - Template tone
 * @returns {Array} Array of templates with the specified tone
 */
export function getVoiceTemplatesByTone(tone) {
  return voiceTemplatesByTone[tone] || [];
}

/**
 * Get random voice template
 * @returns {Object} Random template
 */
export function getRandomVoiceTemplate() {
  const randomIndex = Math.floor(Math.random() * voiceTemplates.length);
  return voiceTemplates[randomIndex];
}

/**
 * Get all voice template IDs
 * @returns {Array} Array of template IDs
 */
export function getAllVoiceTemplateIds() {
  return voiceTemplates.map(template => template.id);
}

/**
 * Get all voice categories
 * @returns {Array} Array of available categories
 */
export function getAllVoiceCategories() {
  return Object.keys(voiceTemplatesByCategory);
}

/**
 * Get all voice tones
 * @returns {Array} Array of available tones
 */
export function getAllVoiceTones() {
  return Object.keys(voiceTemplatesByTone);
}

/**
 * Personalize voice script with contact and config data
 * @param {Object} template - Voice template object
 * @param {Object} contact - Contact information
 * @param {Object} config - Configuration data
 * @returns {string} Personalized voice script
 */
export function personalizeVoiceScript(template, contact = {}, config = {}) {
  let script = template.script;
  
  // Extract first name from full name
  const firstName = contact.Name?.split(' ')[0] || 'there';
  const companyName = contact.Company || contact.CompanyName || 'your company';
  const industry = contact.Industry || 'business';
  
  // Default config values
  const callerName = config.callerName || 'Sales Representative';
  const ourCompanyName = config.companyName || 'Our Company';
  const calendlyLink = config.calendlyLink || '';
  
  // Replace placeholders
  const replacements = {
    '[FIRST_NAME]': firstName,
    '[CALLER_NAME]': callerName,
    '[COMPANY_NAME]': ourCompanyName,
    '[CONTACT_COMPANY]': companyName,
    '[INDUSTRY]': industry,
    '[CALENDLY_LINK]': calendlyLink
  };
  
  // Apply all replacements
  Object.entries(replacements).forEach(([placeholder, value]) => {
    script = script.replace(new RegExp(placeholder.replace(/[[\]]/g, '\\$&'), 'g'), value);
  });
  
  return script;
}

export default {
  voiceTemplates,
  voiceTemplatesByCategory,
  voiceTemplatesByTone,
  getVoiceTemplateById,
  getVoiceTemplatesByCategory,
  getVoiceTemplatesByTone,
  getRandomVoiceTemplate,
  getAllVoiceTemplateIds,
  getAllVoiceCategories,
  getAllVoiceTones,
  personalizeVoiceScript
};