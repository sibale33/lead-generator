/**
 * CSV Status Tracker Module
 * Handles status and notes tracking for email and voice campaigns
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

/**
 * Email status constants
 */
export const EMAIL_STATUSES = {
  SENT: 'sent',
  FAILED: 'failed',
  BOUNCED: 'bounced',
  OPENED: 'opened',
  CLICKED: 'clicked',
  REPLIED: 'replied'
};

/**
 * Voice call status constants
 */
export const VOICE_STATUSES = {
  ANSWERED: 'answered',
  VOICEMAIL: 'voicemail',
  NO_ANSWER: 'no-answer',
  OPTED_OUT: 'opted-out',
  SCHEDULED: 'scheduled',
  FAILED: 'failed'
};

/**
 * Status column names
 */
const STATUS_COLUMNS = {
  EMAIL_STATUS: 'EmailStatus',
  EMAIL_NOTES: 'EmailNotes',
  VOICE_STATUS: 'VoiceStatus',
  VOICE_NOTES: 'VoiceNotes',
  LAST_UPDATED: 'LastUpdated'
};

/**
 * Check if CSV file has status columns
 * @param {string} csvPath - Path to CSV file
 * @returns {Promise<boolean>} True if status columns exist
 */
async function hasStatusColumns(csvPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(csvPath)) {
      reject(new Error('File not found'));
      return;
    }

    const stream = fs.createReadStream(csvPath);
    let headerChecked = false;

    stream
      .pipe(csv())
      .on('headers', (headers) => {
        headerChecked = true;
        const hasEmailStatus = headers.includes(STATUS_COLUMNS.EMAIL_STATUS);
        const hasVoiceStatus = headers.includes(STATUS_COLUMNS.VOICE_STATUS);
        const hasLastUpdated = headers.includes(STATUS_COLUMNS.LAST_UPDATED);
        
        resolve(hasEmailStatus && hasVoiceStatus && hasLastUpdated);
        stream.destroy();
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('end', () => {
        if (!headerChecked) {
          resolve(false);
        }
      });
  });
}

/**
 * Read CSV file and return data as array of objects
 * @param {string} csvPath - Path to CSV file
 * @returns {Promise<Array>} Array of CSV row objects
 */
async function readCSVData(csvPath) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    if (!fs.existsSync(csvPath)) {
      reject(new Error('File not found'));
      return;
    }

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Write CSV data to file
 * @param {string} csvPath - Path to CSV file
 * @param {Array} data - Array of objects to write
 * @param {Array} headers - Array of header names
 * @returns {Promise<void>}
 */
async function writeCSVData(csvPath, data, headers) {
  return new Promise((resolve, reject) => {
    if (data.length === 0) {
      reject(new Error('No data to write'));
      return;
    }

    const csvWriter = createObjectCsvWriter({
      path: csvPath,
      header: headers.map(header => ({ id: header, title: header }))
    });

    csvWriter.writeRecords(data)
      .then(() => resolve())
      .catch((error) => reject(error));
  });
}

/**
 * Add status columns to CSV file
 * @param {string} csvPath - Path to CSV file
 * @returns {Object} Result object with success status
 */
export function addStatusColumns(csvPath) {
  try {
    if (!fs.existsSync(csvPath)) {
      return {
        success: false,
        error: 'File not found'
      };
    }

    // Read the file synchronously to check headers
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split('\n');
    
    if (lines.length === 0) {
      return {
        success: false,
        error: 'Empty CSV file'
      };
    }

    const headers = lines[0].split(',').map(h => h.trim());
    
    // Check if status columns already exist
    const hasEmailStatus = headers.includes(STATUS_COLUMNS.EMAIL_STATUS);
    const hasVoiceStatus = headers.includes(STATUS_COLUMNS.VOICE_STATUS);
    const hasLastUpdated = headers.includes(STATUS_COLUMNS.LAST_UPDATED);
    
    if (hasEmailStatus && hasVoiceStatus && hasLastUpdated) {
      return {
        success: true,
        columnsAdded: false,
        message: 'Status columns already exist'
      };
    }

    // Add missing status columns
    const newHeaders = [...headers];
    if (!hasEmailStatus) {
      newHeaders.push(STATUS_COLUMNS.EMAIL_STATUS);
      newHeaders.push(STATUS_COLUMNS.EMAIL_NOTES);
    }
    if (!hasVoiceStatus) {
      newHeaders.push(STATUS_COLUMNS.VOICE_STATUS);
      newHeaders.push(STATUS_COLUMNS.VOICE_NOTES);
    }
    if (!hasLastUpdated) {
      newHeaders.push(STATUS_COLUMNS.LAST_UPDATED);
    }

    // Update all lines with empty values for new columns
    const updatedLines = [newHeaders.join(',')];
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      const newRow = [...row];
      
      // Add empty values for new columns
      const columnsToAdd = newHeaders.length - headers.length;
      for (let j = 0; j < columnsToAdd; j++) {
        newRow.push('');
      }
      
      updatedLines.push(newRow.join(','));
    }

    // Write updated content back to file
    fs.writeFileSync(csvPath, updatedLines.join('\n'));

    return {
      success: true,
      columnsAdded: true,
      message: 'Status columns added successfully'
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to add status columns: ${error.message}`
    };
  }
}

/**
 * Update CSV status for a contact
 * @param {string} csvPath - Path to CSV file
 * @param {Object} statusUpdate - Status update object
 * @returns {Object} Result object with success status
 */
export async function updateCSVStatus(csvPath, statusUpdate) {
  try {
    // Check if status columns exist
    const hasColumns = await hasStatusColumns(csvPath);
    if (!hasColumns) {
      return {
        success: false,
        error: 'CSV file does not have required status columns. Run addStatusColumns first.'
      };
    }

    // Read CSV data
    const data = await readCSVData(csvPath);
    
    if (data.length === 0) {
      return {
        success: false,
        error: 'No data found in CSV file'
      };
    }

    // Find the contact to update
    let contactFound = false;
    let updatedData = data.map(row => {
      let shouldUpdate = false;
      
      // Check if this row matches the contact
      if (statusUpdate.email && row.Email === statusUpdate.email) {
        shouldUpdate = true;
      } else if (statusUpdate.phoneNumber && row.PhoneNumber === statusUpdate.phoneNumber) {
        shouldUpdate = true;
      }

      if (shouldUpdate) {
        contactFound = true;
        const updatedRow = { ...row };
        
        // Update email status and notes
        if (statusUpdate.emailStatus) {
          updatedRow[STATUS_COLUMNS.EMAIL_STATUS] = statusUpdate.emailStatus;
        }
        if (statusUpdate.emailNotes) {
          updatedRow[STATUS_COLUMNS.EMAIL_NOTES] = statusUpdate.emailNotes;
        }
        
        // Update voice status and notes
        if (statusUpdate.voiceStatus) {
          updatedRow[STATUS_COLUMNS.VOICE_STATUS] = statusUpdate.voiceStatus;
        }
        if (statusUpdate.voiceNotes) {
          updatedRow[STATUS_COLUMNS.VOICE_NOTES] = statusUpdate.voiceNotes;
        }
        
        // Update timestamp
        updatedRow[STATUS_COLUMNS.LAST_UPDATED] = new Date().toISOString();
        
        return updatedRow;
      }
      
      return row;
    });

    if (!contactFound) {
      return {
        success: true,
        updated: false,
        message: 'Contact not found in CSV file'
      };
    }

    // Get headers from the first row
    const headers = Object.keys(updatedData[0]);
    
    // Write updated data back to CSV
    await writeCSVData(csvPath, updatedData, headers);

    return {
      success: true,
      updated: true,
      message: 'Status updated successfully'
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to update CSV status: ${error.message}`
    };
  }
}

/**
 * Get status from CSV for a contact
 * @param {string} csvPath - Path to CSV file
 * @param {Object} contact - Contact identifier (email or phoneNumber)
 * @returns {Object} Result object with status data
 */
export async function getStatusFromCSV(csvPath, contact) {
  try {
    const data = await readCSVData(csvPath);
    
    // Find the contact
    const foundContact = data.find(row => {
      if (contact.email && row.Email === contact.email) {
        return true;
      }
      if (contact.phoneNumber && row.PhoneNumber === contact.phoneNumber) {
        return true;
      }
      return false;
    });

    if (!foundContact) {
      return {
        success: true,
        found: false,
        message: 'Contact not found'
      };
    }

    return {
      success: true,
      found: true,
      status: {
        emailStatus: foundContact[STATUS_COLUMNS.EMAIL_STATUS] || '',
        emailNotes: foundContact[STATUS_COLUMNS.EMAIL_NOTES] || '',
        voiceStatus: foundContact[STATUS_COLUMNS.VOICE_STATUS] || '',
        voiceNotes: foundContact[STATUS_COLUMNS.VOICE_NOTES] || '',
        lastUpdated: foundContact[STATUS_COLUMNS.LAST_UPDATED] || ''
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to get status from CSV: ${error.message}`
    };
  }
}

/**
 * Create backup of CSV file
 * @param {string} csvPath - Path to CSV file
 * @returns {Object} Result object with backup path
 */
export function createStatusBackup(csvPath) {
  try {
    if (!fs.existsSync(csvPath)) {
      return {
        success: false,
        error: 'CSV file not found'
      };
    }

    const backupPath = csvPath.replace('.csv', '.backup.csv');
    fs.copyFileSync(csvPath, backupPath);

    return {
      success: true,
      backupPath,
      message: 'Backup created successfully'
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to create backup: ${error.message}`
    };
  }
}

/**
 * Get all contacts with specific status
 * @param {string} csvPath - Path to CSV file
 * @param {Object} filters - Status filters
 * @returns {Promise<Object>} Result with filtered contacts
 */
export async function getContactsByStatus(csvPath, filters = {}) {
  try {
    const data = await readCSVData(csvPath);
    
    const filteredContacts = data.filter(row => {
      let matches = true;
      
      if (filters.emailStatus && row[STATUS_COLUMNS.EMAIL_STATUS] !== filters.emailStatus) {
        matches = false;
      }
      
      if (filters.voiceStatus && row[STATUS_COLUMNS.VOICE_STATUS] !== filters.voiceStatus) {
        matches = false;
      }
      
      return matches;
    });

    return {
      success: true,
      contacts: filteredContacts,
      count: filteredContacts.length
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to filter contacts: ${error.message}`
    };
  }
}

export default {
  EMAIL_STATUSES,
  VOICE_STATUSES,
  addStatusColumns,
  updateCSVStatus,
  getStatusFromCSV,
  createStatusBackup,
  getContactsByStatus
};