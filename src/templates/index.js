/**
 * Template Manager - Central registry for all email templates
 */

import template01 from './template-01-expansion.js';
import template02 from './template-02-problem-solver.js';
import template03 from './template-03-social-proof.js';
import template04 from './template-04-curiosity.js';
import template05 from './template-05-direct.js';
import template06 from './template-06-question.js';
import template07 from './template-07-referral.js';
import template08 from './template-08-urgency.js';
import template09 from './template-09-insight.js';
import template10 from './template-10-follow-up.js';

/**
 * All available email templates
 */
export const templates = [
  template01,
  template02,
  template03,
  template04,
  template05,
  template06,
  template07,
  template08,
  template09,
  template10
];

/**
 * Templates organized by category
 */
export const templatesByCategory = {
  growth: [template01],
  solution: [template02],
  'social-proof': [template03],
  curiosity: [template04],
  direct: [template05],
  engagement: [template06],
  referral: [template07],
  urgency: [template08],
  insight: [template09],
  'follow-up': [template10]
};

/**
 * Templates organized by tone
 */
export const templatesByTone = {
  professional: [template01],
  consultative: [template02],
  confident: [template03],
  intriguing: [template04],
  straightforward: [template05],
  conversational: [template06],
  warm: [template07],
  urgent: [template08],
  informative: [template09],
  respectful: [template10]
};

/**
 * Get template by ID
 * @param {string} id - Template ID
 * @returns {Object|null} Template object or null if not found
 */
export function getTemplateById(id) {
  return templates.find(template => template.id === id) || null;
}

/**
 * Get templates by category
 * @param {string} category - Template category
 * @returns {Array} Array of templates in the category
 */
export function getTemplatesByCategory(category) {
  return templatesByCategory[category] || [];
}

/**
 * Get templates by tone
 * @param {string} tone - Template tone
 * @returns {Array} Array of templates with the specified tone
 */
export function getTemplatesByTone(tone) {
  return templatesByTone[tone] || [];
}

/**
 * Get random template
 * @returns {Object} Random template
 */
export function getRandomTemplate() {
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

/**
 * Get all template IDs
 * @returns {Array} Array of template IDs
 */
export function getAllTemplateIds() {
  return templates.map(template => template.id);
}

/**
 * Get all categories
 * @returns {Array} Array of available categories
 */
export function getAllCategories() {
  return Object.keys(templatesByCategory);
}

/**
 * Get all tones
 * @returns {Array} Array of available tones
 */
export function getAllTones() {
  return Object.keys(templatesByTone);
}

export default {
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
};