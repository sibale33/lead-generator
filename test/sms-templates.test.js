/**
 * SMS Templates Tests
 * Tests for SMS template system
 */

import { expect } from 'chai';
import {
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
} from '../src/sms-templates/index.js';

describe('SMS Templates System', () => {
  describe('Template Structure', () => {
    it('should have all required SMS templates', () => {
      expect(smsTemplates).to.be.an('array');
      expect(smsTemplates.length).to.be.at.least(5);
      
      // Check that each template has required properties
      smsTemplates.forEach(template => {
        expect(template).to.have.property('id');
        expect(template).to.have.property('name');
        expect(template).to.have.property('category');
        expect(template).to.have.property('tone');
        expect(template).to.have.property('message');
        expect(template).to.have.property('placeholders');
        expect(template).to.have.property('metadata');
      });
    });

    it('should have valid template structure', () => {
      const template = smsTemplates[0];
      
      expect(template.id).to.be.a('string');
      expect(template.name).to.be.a('string');
      expect(template.category).to.be.a('string');
      expect(template.tone).to.be.a('string');
      expect(template.message).to.be.a('string');
      expect(template.placeholders).to.be.an('array');
      expect(template.metadata).to.be.an('object');
      
      // Check metadata structure
      expect(template.metadata).to.have.property('estimatedLength');
      expect(template.metadata).to.have.property('maxLength');
      expect(template.metadata).to.have.property('callToAction');
    });

    it('should have unique template IDs', () => {
      const ids = smsTemplates.map(template => template.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).to.equal(uniqueIds.length);
    });

    it('should have messages within SMS character limits', () => {
      smsTemplates.forEach(template => {
        expect(template.metadata.estimatedLength).to.be.at.most(160);
        expect(template.metadata.maxLength).to.be.at.most(1600); // MMS limit
        expect(template.message.length).to.be.at.most(200); // Template with placeholders
      });
    });
  });

  describe('Template Organization', () => {
    it('should organize templates by category', () => {
      expect(smsTemplatesByCategory).to.be.an('object');
      expect(Object.keys(smsTemplatesByCategory).length).to.be.at.least(4);
      
      // Check that categories contain arrays of templates
      Object.values(smsTemplatesByCategory).forEach(categoryTemplates => {
        expect(categoryTemplates).to.be.an('array');
        expect(categoryTemplates.length).to.be.at.least(1);
      });
    });

    it('should organize templates by tone', () => {
      expect(smsTemplatesByTone).to.be.an('object');
      expect(Object.keys(smsTemplatesByTone).length).to.be.at.least(4);
      
      // Check that tones contain arrays of templates
      Object.values(smsTemplatesByTone).forEach(toneTemplates => {
        expect(toneTemplates).to.be.an('array');
        expect(toneTemplates.length).to.be.at.least(1);
      });
    });
  });

  describe('Template Retrieval Functions', () => {
    it('should get template by ID', () => {
      const template = getSmsTemplateById('sms-expansion');
      expect(template).to.not.be.null;
      expect(template.id).to.equal('sms-expansion');
    });

    it('should return null for invalid ID', () => {
      const template = getSmsTemplateById('invalid-id');
      expect(template).to.be.null;
    });

    it('should get templates by category', () => {
      const categories = Object.keys(smsTemplatesByCategory);
      const category = categories[0];
      const templates = getSmsTemplatesByCategory(category);
      expect(templates).to.be.an('array');
      expect(templates.length).to.be.at.least(1);
    });

    it('should get templates by tone', () => {
      const tones = Object.keys(smsTemplatesByTone);
      const tone = tones[0];
      const templates = getSmsTemplatesByTone(tone);
      expect(templates).to.be.an('array');
      expect(templates.length).to.be.at.least(1);
    });

    it('should get random template', () => {
      const template = getRandomSmsTemplate();
      expect(template).to.be.an('object');
      expect(template).to.have.property('id');
      expect(smsTemplates).to.include(template);
    });

    it('should get all template IDs', () => {
      const ids = getAllSmsTemplateIds();
      expect(ids).to.be.an('array');
      expect(ids.length).to.equal(smsTemplates.length);
      expect(ids).to.include('sms-expansion');
    });

    it('should get all categories', () => {
      const categories = getAllSmsCategories();
      expect(categories).to.be.an('array');
      expect(categories.length).to.be.at.least(4);
      expect(categories).to.include('growth');
    });

    it('should get all tones', () => {
      const tones = getAllSmsTones();
      expect(tones).to.be.an('array');
      expect(tones.length).to.be.at.least(4);
      expect(tones).to.include('professional');
    });
  });

  describe('SMS Personalization', () => {
    it('should personalize SMS template with contact data', () => {
      const template = getSmsTemplateById('sms-expansion');
      const contactData = {
        firstName: 'John',
        companyName: 'Acme Corp',
        industry: 'technology'
      };
      const senderInfo = {
        name: 'Alex',
        company: 'Growth Co'
      };
      
      const personalizedSms = personalizeSmsTemplate(template, contactData, senderInfo);
      
      expect(personalizedSms).to.have.property('message');
      expect(personalizedSms).to.have.property('template');
      expect(personalizedSms).to.have.property('category');
      expect(personalizedSms).to.have.property('tone');
      expect(personalizedSms).to.have.property('length');
      expect(personalizedSms).to.have.property('metadata');
      
      expect(personalizedSms.message).to.include('John');
      expect(personalizedSms.message).to.include('Acme Corp');
      expect(personalizedSms.message).to.include('technology');
      expect(personalizedSms.message).to.include('Alex');
      expect(personalizedSms.template).to.equal('sms-expansion');
    });

    it('should handle missing contact data gracefully', () => {
      const template = getSmsTemplateById('sms-direct');
      const contactData = {}; // Empty contact data
      const senderInfo = { name: 'Alex' };
      
      const personalizedSms = personalizeSmsTemplate(template, contactData, senderInfo);
      
      expect(personalizedSms.message).to.include('there'); // Default firstName
      expect(personalizedSms.message).to.include('your company'); // Default companyName
      expect(personalizedSms.message).to.include('Alex');
    });

    it('should handle missing sender info gracefully', () => {
      const template = getSmsTemplateById('sms-social-proof');
      const contactData = {
        firstName: 'Jane',
        companyName: 'Tech Inc'
      };
      const senderInfo = {}; // Empty sender info
      
      const personalizedSms = personalizeSmsTemplate(template, contactData, senderInfo);
      
      expect(personalizedSms.message).to.include('Jane');
      expect(personalizedSms.message).to.include('Tech Inc');
      expect(personalizedSms.message).to.include('Alex'); // Default sender name
    });

    it('should respect character limits', () => {
      const template = getSmsTemplateById('sms-urgency');
      const contactData = {
        firstName: 'John',
        companyName: 'Very Long Company Name That Might Exceed Character Limits',
        offer: 'Very detailed offer description that is quite long'
      };
      const senderInfo = { name: 'Alex' };
      
      const personalizedSms = personalizeSmsTemplate(template, contactData, senderInfo, {
        maxLength: 160
      });
      
      expect(personalizedSms.length).to.be.at.most(160);
    });

    it('should use short message when preferred', () => {
      const template = getSmsTemplateById('sms-expansion');
      const contactData = {
        firstName: 'John',
        companyName: 'Acme Corp'
      };
      const senderInfo = { name: 'Alex' };
      
      const personalizedSms = personalizeSmsTemplate(template, contactData, senderInfo, {
        preferShort: true
      });
      
      // Should use shortMessage if available
      if (template.shortMessage) {
        expect(personalizedSms.length).to.be.lessThan(template.message.length);
      }
    });

    it('should throw error for missing template', () => {
      expect(() => {
        personalizeSmsTemplate(null, {}, {});
      }).to.throw('Template is required for SMS personalization');
    });

    it('should include metadata in personalized SMS', () => {
      const template = getSmsTemplateById('sms-problem-solver');
      const contactData = { firstName: 'John' };
      const senderInfo = { name: 'Alex' };
      
      const personalizedSms = personalizeSmsTemplate(template, contactData, senderInfo);
      
      expect(personalizedSms.metadata).to.have.property('personalizedAt');
      expect(personalizedSms.metadata).to.have.property('contactId');
      expect(personalizedSms.metadata.personalizedAt).to.be.a('string');
    });
  });

  describe('Template Categories and Tones', () => {
    it('should have growth category templates', () => {
      const growthTemplates = getSmsTemplatesByCategory('growth');
      expect(growthTemplates.length).to.be.at.least(1);
      growthTemplates.forEach(template => {
        expect(template.category).to.equal('growth');
      });
    });

    it('should have professional tone templates', () => {
      const professionalTemplates = getSmsTemplatesByTone('professional');
      expect(professionalTemplates.length).to.be.at.least(1);
      professionalTemplates.forEach(template => {
        expect(template.tone).to.equal('professional');
      });
    });

    it('should have urgent tone templates', () => {
      const urgentTemplates = getSmsTemplatesByTone('urgent');
      expect(urgentTemplates.length).to.be.at.least(1);
      urgentTemplates.forEach(template => {
        expect(template.tone).to.equal('urgent');
      });
    });
  });

  describe('Template Content Quality', () => {
    it('should have clear call-to-action in each template', () => {
      smsTemplates.forEach(template => {
        expect(template.metadata.callToAction).to.be.a('string');
        expect(template.metadata.callToAction.length).to.be.greaterThan(0);
      });
    });

    it('should have appropriate urgency levels', () => {
      smsTemplates.forEach(template => {
        expect(template.metadata.urgency).to.be.oneOf(['low', 'medium', 'high']);
      });
    });

    it('should have placeholders that match message content', () => {
      smsTemplates.forEach(template => {
        template.placeholders.forEach(placeholder => {
          const placeholderPattern = new RegExp(`{{${placeholder}}}`, 'g');
          const hasInMessage = placeholderPattern.test(template.message);
          const hasInShortMessage = template.shortMessage && new RegExp(`{{${placeholder}}}`, 'g').test(template.shortMessage);
          const hasPlaceholder = hasInMessage || hasInShortMessage;
          expect(hasPlaceholder).to.be.true;
        });
      });
    });
  });
});