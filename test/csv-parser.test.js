/**
 * CSV Parser Tests
 * Testing CSV parsing functionality for lead data
 */

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCSV, validateLeadData, extractEmails } from '../src/csv-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CSV Parser', () => {
  const testDataDir = path.join(__dirname, 'fixtures');
  const validCSVPath = path.join(testDataDir, 'valid-leads.csv');
  const invalidCSVPath = path.join(testDataDir, 'invalid-leads.csv');

  before(async () => {
    // Create test fixtures directory
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // Create valid CSV test file
    const validCSVContent = `FirstName,LastName,Company,WorkEmail,PersonalEmail,Phone,Industry,Title
John,Doe,Acme Corp,john.doe@acme.com,john@personal.com,555-0123,Technology,CTO
Jane,Smith,Beta Inc,jane.smith@beta.com,,555-0456,Healthcare,VP Engineering
Bob,Johnson,Gamma LLC,,bob@gmail.com,555-0789,Finance,Director`;

    fs.writeFileSync(validCSVPath, validCSVContent);

    // Create invalid CSV test file
    const invalidCSVContent = `FirstName,LastName,Company
John,Doe,Acme Corp
Jane,Smith,Beta Inc`;

    fs.writeFileSync(invalidCSVPath, invalidCSVContent);
  });

  after(() => {
    // Clean up test files
    if (fs.existsSync(validCSVPath)) fs.unlinkSync(validCSVPath);
    if (fs.existsSync(invalidCSVPath)) fs.unlinkSync(invalidCSVPath);
    if (fs.existsSync(testDataDir)) fs.rmdirSync(testDataDir);
  });

  describe('parseCSV', () => {
    it('should parse valid CSV file successfully', async () => {
      const leads = await parseCSV(validCSVPath);
      
      expect(leads).to.be.an('array');
      expect(leads).to.have.length(3);
      
      const firstLead = leads[0];
      expect(firstLead).to.have.property('FirstName', 'John');
      expect(firstLead).to.have.property('LastName', 'Doe');
      expect(firstLead).to.have.property('Company', 'Acme Corp');
      expect(firstLead).to.have.property('WorkEmail', 'john.doe@acme.com');
      expect(firstLead).to.have.property('PersonalEmail', 'john@personal.com');
      expect(firstLead).to.have.property('Phone', '555-0123');
    });

    it('should handle empty cells in CSV', async () => {
      const leads = await parseCSV(validCSVPath);
      const secondLead = leads[1];
      
      expect(secondLead.PersonalEmail).to.equal('');
      expect(secondLead.WorkEmail).to.equal('jane.smith@beta.com');
    });

    it('should throw error for non-existent file', async () => {
      try {
        await parseCSV('non-existent-file.csv');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('File not found');
      }
    });

    it('should handle CSV with custom delimiter', async () => {
      const customCSVPath = path.join(testDataDir, 'custom-delimiter.csv');
      const customCSVContent = `FirstName;LastName;Company;WorkEmail
John;Doe;Acme Corp;john.doe@acme.com`;
      
      fs.writeFileSync(customCSVPath, customCSVContent);
      
      const leads = await parseCSV(customCSVPath, { delimiter: ';' });
      expect(leads).to.have.length(1);
      expect(leads[0].FirstName).to.equal('John');
      
      fs.unlinkSync(customCSVPath);
    });
  });

  describe('validateLeadData', () => {
    it('should validate lead with work email', () => {
      const lead = {
        FirstName: 'John',
        LastName: 'Doe',
        Company: 'Acme Corp',
        WorkEmail: 'john.doe@acme.com',
        PersonalEmail: '',
        Phone: '555-0123'
      };

      const result = validateLeadData(lead);
      expect(result.isValid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should validate lead with personal email only', () => {
      const lead = {
        FirstName: 'Jane',
        LastName: 'Smith',
        Company: 'Beta Inc',
        WorkEmail: '',
        PersonalEmail: 'jane@personal.com',
        Phone: '555-0456'
      };

      const result = validateLeadData(lead);
      expect(result.isValid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('should fail validation for lead without any email', () => {
      const lead = {
        FirstName: 'Bob',
        LastName: 'Johnson',
        Company: 'Gamma LLC',
        WorkEmail: '',
        PersonalEmail: '',
        Phone: '555-0789'
      };

      const result = validateLeadData(lead);
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('No valid email address found');
    });

    it('should fail validation for lead without required fields', () => {
      const lead = {
        WorkEmail: 'test@example.com'
      };

      const result = validateLeadData(lead);
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('FirstName is required');
      expect(result.errors).to.include('Company is required');
    });

    it('should fail validation for invalid email format', () => {
      const lead = {
        FirstName: 'John',
        LastName: 'Doe',
        Company: 'Acme Corp',
        WorkEmail: 'invalid-email',
        PersonalEmail: '',
        Phone: '555-0123'
      };

      const result = validateLeadData(lead);
      expect(result.isValid).to.be.false;
      expect(result.errors).to.include('Invalid work email format');
    });
  });

  describe('extractEmails', () => {
    it('should extract work email when available', () => {
      const lead = {
        WorkEmail: 'john.doe@acme.com',
        PersonalEmail: 'john@personal.com'
      };

      const emails = extractEmails(lead);
      expect(emails.primary).to.equal('john.doe@acme.com');
      expect(emails.secondary).to.equal('john@personal.com');
      expect(emails.type).to.equal('work');
    });

    it('should extract personal email when work email not available', () => {
      const lead = {
        WorkEmail: '',
        PersonalEmail: 'jane@personal.com'
      };

      const emails = extractEmails(lead);
      expect(emails.primary).to.equal('jane@personal.com');
      expect(emails.secondary).to.be.null;
      expect(emails.type).to.equal('personal');
    });

    it('should return null for lead without emails', () => {
      const lead = {
        WorkEmail: '',
        PersonalEmail: ''
      };

      const emails = extractEmails(lead);
      expect(emails).to.be.null;
    });
  });
});