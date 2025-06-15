/**
 * Voice Templates Test Suite
 * Tests for voice call template system
 */

import { expect } from 'chai';
import {
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
} from '../src/voice-templates/index.js';

describe('Voice Templates System', () => {
  describe('Template Structure', () => {
    it('should have all required templates', () => {
      expect(voiceTemplates).to.be.an('array');
      expect(voiceTemplates).to.have.length.at.least(10);
    });

    it('should have valid template structure', () => {
      voiceTemplates.forEach(template => {
        expect(template).to.have.property('id');
        expect(template).to.have.property('name');
        expect(template).to.have.property('script');
        expect(template).to.have.property('placeholders');
        expect(template).to.have.property('category');
        expect(template).to.have.property('tone');
        expect(template).to.have.property('duration');
        expect(template).to.have.property('approach');
        
        expect(template.id).to.be.a('string');
        expect(template.name).to.be.a('string');
        expect(template.script).to.be.a('string');
        expect(template.placeholders).to.be.an('array');
        expect(template.category).to.be.a('string');
        expect(template.tone).to.be.a('string');
        expect(template.duration).to.be.a('string');
        expect(template.approach).to.be.a('string');
      });
    });

    it('should have unique template IDs', () => {
      const ids = voiceTemplates.map(t => t.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids).to.have.length(uniqueIds.length);
    });
  });

  describe('Template Organization', () => {
    it('should organize templates by category', () => {
      expect(voiceTemplatesByCategory).to.be.an('object');
      expect(Object.keys(voiceTemplatesByCategory)).to.have.length.at.least(5);
    });

    it('should organize templates by tone', () => {
      expect(voiceTemplatesByTone).to.be.an('object');
      expect(Object.keys(voiceTemplatesByTone)).to.have.length.at.least(5);
    });
  });

  describe('Template Retrieval Functions', () => {
    it('should get template by ID', () => {
      const firstTemplate = voiceTemplates[0];
      const retrieved = getVoiceTemplateById(firstTemplate.id);
      expect(retrieved).to.deep.equal(firstTemplate);
    });

    it('should return null for invalid ID', () => {
      const retrieved = getVoiceTemplateById('invalid-id');
      expect(retrieved).to.be.null;
    });

    it('should get templates by category', () => {
      const categories = Object.keys(voiceTemplatesByCategory);
      const category = categories[0];
      const templates = getVoiceTemplatesByCategory(category);
      expect(templates).to.be.an('array');
      expect(templates.length).to.be.at.least(1);
    });

    it('should get templates by tone', () => {
      const tones = Object.keys(voiceTemplatesByTone);
      const tone = tones[0];
      const templates = getVoiceTemplatesByTone(tone);
      expect(templates).to.be.an('array');
      expect(templates.length).to.be.at.least(1);
    });

    it('should get random template', () => {
      const template = getRandomVoiceTemplate();
      expect(template).to.be.an('object');
      expect(voiceTemplates).to.include(template);
    });

    it('should get all template IDs', () => {
      const ids = getAllVoiceTemplateIds();
      expect(ids).to.be.an('array');
      expect(ids).to.have.length(voiceTemplates.length);
    });

    it('should get all categories', () => {
      const categories = getAllVoiceCategories();
      expect(categories).to.be.an('array');
      expect(categories.length).to.be.at.least(5);
    });

    it('should get all tones', () => {
      const tones = getAllVoiceTones();
      expect(tones).to.be.an('array');
      expect(tones.length).to.be.at.least(5);
    });
  });

  describe('Script Personalization', () => {
    it('should personalize voice script with contact data', () => {
      const template = voiceTemplates[0];
      const contact = {
        Name: 'John Smith',
        Company: 'Acme Corp',
        Industry: 'Technology'
      };
      const config = {
        callerName: 'Sarah Johnson',
        companyName: 'TechSolutions',
        calendlyLink: 'https://calendly.com/sarah'
      };

      const personalized = personalizeVoiceScript(template, contact, config);
      
      expect(personalized).to.be.a('string');
      expect(personalized).to.include('John');
      expect(personalized).to.include('Sarah Johnson');
      expect(personalized).to.include('TechSolutions');
    });

    it('should handle missing contact data gracefully', () => {
      const template = voiceTemplates[0];
      const contact = {};
      const config = {
        callerName: 'Sarah Johnson',
        companyName: 'TechSolutions'
      };

      const personalized = personalizeVoiceScript(template, contact, config);
      
      expect(personalized).to.be.a('string');
      expect(personalized).to.not.include('[FIRST_NAME]');
      expect(personalized).to.not.include('[COMPANY_NAME]');
    });

    it('should handle missing config data gracefully', () => {
      const template = voiceTemplates[0];
      const contact = {
        Name: 'John Smith'
      };
      const config = {};

      const personalized = personalizeVoiceScript(template, contact, config);
      
      expect(personalized).to.be.a('string');
      expect(personalized).to.include('John');
    });
  });
});