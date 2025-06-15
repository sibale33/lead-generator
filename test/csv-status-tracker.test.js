/**
 * CSV Status Tracker Test Suite
 * Tests for CSV status and notes tracking functionality
 */

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import {
  updateCSVStatus,
  addStatusColumns,
  getStatusFromCSV,
  createStatusBackup,
  EMAIL_STATUSES,
  VOICE_STATUSES
} from '../src/csv-status-tracker.js';

describe('CSV Status Tracker', () => {
  const testDir = './test-data';
  const testCSVPath = path.join(testDir, 'test-status.csv');
  const backupPath = path.join(testDir, 'test-status.backup.csv');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create test CSV file
    const testCSVContent = `Name,Email,PhoneNumber,Company
John Doe,john@example.com,+1234567890,Acme Corp
Jane Smith,jane@example.com,+1987654321,Tech Inc`;
    fs.writeFileSync(testCSVPath, testCSVContent);
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testCSVPath)) fs.unlinkSync(testCSVPath);
    if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
    if (fs.existsSync(testDir)) {
      try {
        fs.rmSync(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Status Constants', () => {
    it('should have email status constants', () => {
      expect(EMAIL_STATUSES).to.be.an('object');
      expect(EMAIL_STATUSES.SENT).to.equal('sent');
      expect(EMAIL_STATUSES.FAILED).to.equal('failed');
      expect(EMAIL_STATUSES.BOUNCED).to.equal('bounced');
      expect(EMAIL_STATUSES.OPENED).to.equal('opened');
      expect(EMAIL_STATUSES.CLICKED).to.equal('clicked');
      expect(EMAIL_STATUSES.REPLIED).to.equal('replied');
    });

    it('should have voice status constants', () => {
      expect(VOICE_STATUSES).to.be.an('object');
      expect(VOICE_STATUSES.ANSWERED).to.equal('answered');
      expect(VOICE_STATUSES.VOICEMAIL).to.equal('voicemail');
      expect(VOICE_STATUSES.NO_ANSWER).to.equal('no-answer');
      expect(VOICE_STATUSES.OPTED_OUT).to.equal('opted-out');
      expect(VOICE_STATUSES.SCHEDULED).to.equal('scheduled');
      expect(VOICE_STATUSES.FAILED).to.equal('failed');
    });
  });

  describe('addStatusColumns', () => {
    it('should add status columns to CSV without existing status columns', () => {
      const result = addStatusColumns(testCSVPath);
      
      expect(result.success).to.be.true;
      expect(result.columnsAdded).to.be.true;
      
      const updatedContent = fs.readFileSync(testCSVPath, 'utf8');
      expect(updatedContent).to.include('EmailStatus');
      expect(updatedContent).to.include('EmailNotes');
      expect(updatedContent).to.include('VoiceStatus');
      expect(updatedContent).to.include('VoiceNotes');
      expect(updatedContent).to.include('LastUpdated');
    });

    it('should not add columns if they already exist', () => {
      // First add columns
      addStatusColumns(testCSVPath);
      
      // Try to add again
      const result = addStatusColumns(testCSVPath);
      
      expect(result.success).to.be.true;
      expect(result.columnsAdded).to.be.false;
      expect(result.message).to.include('already exist');
    });

    it('should handle non-existent file', () => {
      const result = addStatusColumns('./non-existent.csv');
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('File not found');
    });
  });

  describe('updateCSVStatus', () => {
    beforeEach(() => {
      // Add status columns first
      addStatusColumns(testCSVPath);
    });

    it('should update email status for existing contact', async () => {
      const result = await updateCSVStatus(testCSVPath, {
        email: 'john@example.com',
        emailStatus: EMAIL_STATUSES.SENT,
        emailNotes: 'Email sent successfully'
      });

      expect(result.success).to.be.true;
      expect(result.updated).to.be.true;

      const content = fs.readFileSync(testCSVPath, 'utf8');
      expect(content).to.include('sent');
      expect(content).to.include('Email sent successfully');
    });

    it('should update voice status for existing contact', async () => {
      const result = await updateCSVStatus(testCSVPath, {
        phoneNumber: '+1234567890',
        voiceStatus: VOICE_STATUSES.ANSWERED,
        voiceNotes: 'Contact answered, interested'
      });

      expect(result.success).to.be.true;
      expect(result.updated).to.be.true;

      const content = fs.readFileSync(testCSVPath, 'utf8');
      expect(content).to.include('answered');
      expect(content).to.include('Contact answered, interested');
    });

    it('should update both email and voice status', async () => {
      const result = await updateCSVStatus(testCSVPath, {
        email: 'jane@example.com',
        emailStatus: EMAIL_STATUSES.OPENED,
        emailNotes: 'Email opened',
        voiceStatus: VOICE_STATUSES.SCHEDULED,
        voiceNotes: 'Meeting scheduled'
      });

      expect(result.success).to.be.true;
      expect(result.updated).to.be.true;

      const content = fs.readFileSync(testCSVPath, 'utf8');
      expect(content).to.include('opened');
      expect(content).to.include('scheduled');
      expect(content).to.include('Email opened');
      expect(content).to.include('Meeting scheduled');
    });

    it('should handle contact not found', async () => {
      const result = await updateCSVStatus(testCSVPath, {
        email: 'notfound@example.com',
        emailStatus: EMAIL_STATUSES.SENT
      });

      expect(result.success).to.be.true;
      expect(result.updated).to.be.false;
      expect(result.message).to.include('not found');
    });

    it('should handle missing status columns', async () => {
      // Create CSV without status columns
      const csvWithoutStatus = path.join(testDir, 'no-status.csv');
      const content = `Name,Email,PhoneNumber
John Doe,john@example.com,+1234567890`;
      fs.writeFileSync(csvWithoutStatus, content);

      const result = await updateCSVStatus(csvWithoutStatus, {
        email: 'john@example.com',
        emailStatus: EMAIL_STATUSES.SENT
      });

      expect(result.success).to.be.false;
      expect(result.error).to.include('status columns');

      // Clean up
      fs.unlinkSync(csvWithoutStatus);
    });
  });

  describe('getStatusFromCSV', () => {
    beforeEach(async () => {
      addStatusColumns(testCSVPath);
      await updateCSVStatus(testCSVPath, {
        email: 'john@example.com',
        emailStatus: EMAIL_STATUSES.SENT,
        emailNotes: 'Test email'
      });
    });

    it('should get status for existing contact by email', async () => {
      const result = await getStatusFromCSV(testCSVPath, { email: 'john@example.com' });

      expect(result.success).to.be.true;
      expect(result.found).to.be.true;
      expect(result.status.emailStatus).to.equal('sent');
      expect(result.status.emailNotes).to.equal('Test email');
    });

    it('should get status for existing contact by phone', async () => {
      await updateCSVStatus(testCSVPath, {
        phoneNumber: '+1234567890',
        voiceStatus: VOICE_STATUSES.ANSWERED
      });

      const result = await getStatusFromCSV(testCSVPath, { phoneNumber: '+1234567890' });

      expect(result.success).to.be.true;
      expect(result.found).to.be.true;
      expect(result.status.voiceStatus).to.equal('answered');
    });

    it('should handle contact not found', async () => {
      const result = await getStatusFromCSV(testCSVPath, { email: 'notfound@example.com' });

      expect(result.success).to.be.true;
      expect(result.found).to.be.false;
    });
  });

  describe('createStatusBackup', () => {
    it('should create backup of CSV file', () => {
      const result = createStatusBackup(testCSVPath);

      expect(result.success).to.be.true;
      expect(fs.existsSync(result.backupPath)).to.be.true;

      const originalContent = fs.readFileSync(testCSVPath, 'utf8');
      const backupContent = fs.readFileSync(result.backupPath, 'utf8');
      expect(originalContent).to.equal(backupContent);
    });

    it('should handle non-existent file', () => {
      const result = createStatusBackup('./non-existent.csv');

      expect(result.success).to.be.false;
      expect(result.error).to.include('not found');
    });
  });

  describe('Integration with timestamp', () => {
    beforeEach(() => {
      addStatusColumns(testCSVPath);
    });

    it('should add timestamp when updating status', async () => {
      const beforeTime = new Date().toISOString();
      
      await updateCSVStatus(testCSVPath, {
        email: 'john@example.com',
        emailStatus: EMAIL_STATUSES.SENT
      });

      const afterTime = new Date().toISOString();
      const content = fs.readFileSync(testCSVPath, 'utf8');
      
      // Check that a timestamp was added (should be between before and after)
      const lines = content.split('\n');
      const dataLine = lines[1]; // First data row
      expect(dataLine).to.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp pattern
    });
  });
});