/**
 * CSV Parser Module
 * Handles parsing and validation of lead data from CSV files
 */

import fs from 'fs';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';

/**
 * Parse CSV file and return array of lead objects
 * @param {string} filePath - Path to CSV file
 * @param {Object} options - Parsing options
 * @param {string} options.delimiter - CSV delimiter (default: ',')
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @returns {Promise<Array>} Array of lead objects
 */
export async function parseCSV(filePath, options = {}) {
  const { delimiter = ',', encoding = 'utf8' } = options;

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return new Promise((resolve, reject) => {
    const leads = [];
    const errors = [];

    createReadStream(filePath, { encoding })
      .pipe(csvParser({ separator: delimiter }))
      .on('data', (row) => {
        // Clean up row data - trim whitespace and handle empty strings
        const cleanedRow = {};
        for (const [key, value] of Object.entries(row)) {
          cleanedRow[key.trim()] = typeof value === 'string' ? value.trim() : value;
        }
        leads.push(cleanedRow);
      })
      .on('end', () => {
        if (errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${errors.join(', ')}`));
        } else {
          resolve(leads);
        }
      })
      .on('error', (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      });
  });
}

/**
 * Validate lead data structure and required fields
 * @param {Object} lead - Lead object to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export function validateLeadData(lead) {
  const errors = [];
  const requiredFields = ['FirstName', 'Company'];

  // Check required fields
  for (const field of requiredFields) {
    if (!lead[field] || lead[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  }

  // Check that at least one email is provided
  const hasWorkEmail = lead.WorkEmail && lead.WorkEmail.trim() !== '';
  const hasPersonalEmail = lead.PersonalEmail && lead.PersonalEmail.trim() !== '';

  if (!hasWorkEmail && !hasPersonalEmail) {
    errors.push('No valid email address found');
  }

  // Validate email formats
  if (hasWorkEmail && !isValidEmail(lead.WorkEmail)) {
    errors.push('Invalid work email format');
  }

  if (hasPersonalEmail && !isValidEmail(lead.PersonalEmail)) {
    errors.push('Invalid personal email format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Extract email addresses from lead data with priority
 * @param {Object} lead - Lead object
 * @returns {Object|null} Email extraction result or null if no valid emails
 */
export function extractEmails(lead) {
  const workEmail = lead.WorkEmail?.trim();
  const personalEmail = lead.PersonalEmail?.trim();

  // Prioritize work email over personal email
  if (workEmail && isValidEmail(workEmail)) {
    return {
      primary: workEmail,
      secondary: personalEmail && isValidEmail(personalEmail) ? personalEmail : null,
      type: 'work'
    };
  }

  if (personalEmail && isValidEmail(personalEmail)) {
    return {
      primary: personalEmail,
      secondary: null,
      type: 'personal'
    };
  }

  return null;
}

/**
 * Validate email format using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Process CSV file and return validated leads with email extraction
 * @param {string} filePath - Path to CSV file
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Processing result with valid leads, invalid leads, and stats
 */
export async function processLeadsFromCSV(filePath, options = {}) {
  try {
    const rawLeads = await parseCSV(filePath, options);
    const validLeads = [];
    const invalidLeads = [];
    const stats = {
      total: rawLeads.length,
      valid: 0,
      invalid: 0,
      workEmails: 0,
      personalEmails: 0
    };

    for (const lead of rawLeads) {
      const validation = validateLeadData(lead);
      
      if (validation.isValid) {
        const emails = extractEmails(lead);
        const processedLead = {
          ...lead,
          emails,
          validation
        };
        
        validLeads.push(processedLead);
        stats.valid++;
        
        if (emails?.type === 'work') {
          stats.workEmails++;
        } else if (emails?.type === 'personal') {
          stats.personalEmails++;
        }
      } else {
        invalidLeads.push({
          ...lead,
          validation
        });
        stats.invalid++;
      }
    }

    return {
      validLeads,
      invalidLeads,
      stats
    };
  } catch (error) {
    throw new Error(`Failed to process leads from CSV: ${error.message}`);
  }
}

/**
 * Get lead statistics from processed data
 * @param {Array} leads - Array of processed leads
 * @returns {Object} Statistics object
 */
export function getLeadStats(leads) {
  const stats = {
    total: leads.length,
    workEmails: 0,
    personalEmails: 0,
    companies: new Set(),
    industries: new Set()
  };

  for (const lead of leads) {
    if (lead.emails?.type === 'work') {
      stats.workEmails++;
    } else if (lead.emails?.type === 'personal') {
      stats.personalEmails++;
    }

    if (lead.Company) {
      stats.companies.add(lead.Company);
    }

    if (lead.Industry) {
      stats.industries.add(lead.Industry);
    }
  }

  stats.uniqueCompanies = stats.companies.size;
  stats.uniqueIndustries = stats.industries.size;

  return stats;
}

export default {
  parseCSV,
  validateLeadData,
  extractEmails,
  processLeadsFromCSV,
  getLeadStats
};