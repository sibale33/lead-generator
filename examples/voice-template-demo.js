/**
 * Voice Template System Demo
 * Demonstrates the new voice call template functionality
 */

import { 
  voiceTemplates,
  getVoiceTemplateById,
  getRandomVoiceTemplate,
  getVoiceTemplatesByCategory,
  getVoiceTemplatesByTone,
  personalizeVoiceScript,
  getAllVoiceCategories,
  getAllVoiceTones
} from '../src/voice-templates/index.js';

console.log('🎙️  Voice Template System Demo\n');

// Show available templates
console.log(`📋 Available Templates: ${voiceTemplates.length}`);
voiceTemplates.forEach((template, index) => {
  console.log(`   ${index + 1}. ${template.name} (${template.id}) - ${template.category}/${template.tone}`);
});

console.log(`\n📂 Categories: ${getAllVoiceCategories().join(', ')}`);
console.log(`🎭 Tones: ${getAllVoiceTones().join(', ')}\n`);

// Demo specific template
console.log('🎯 Demo: Professional Opener Template');
const professionalTemplate = getVoiceTemplateById('professional-opener');
console.log(`Template: ${professionalTemplate.name}`);
console.log(`Category: ${professionalTemplate.category}`);
console.log(`Tone: ${professionalTemplate.tone}`);
console.log(`Duration: ${professionalTemplate.duration}`);
console.log(`Approach: ${professionalTemplate.approach}\n`);

// Demo personalization
console.log('👤 Demo: Script Personalization');
const sampleContact = {
  Name: 'John Smith',
  Company: 'Acme Corporation',
  Industry: 'Technology'
};

const sampleConfig = {
  callerName: 'Sarah Johnson',
  companyName: 'TechSolutions Inc',
  calendlyLink: 'https://calendly.com/sarah-johnson'
};

const personalizedScript = personalizeVoiceScript(professionalTemplate, sampleContact, sampleConfig);
console.log('📞 Personalized Script:');
console.log('─'.repeat(50));
console.log(personalizedScript);
console.log('─'.repeat(50));

// Demo random template selection
console.log('\n🎲 Demo: Random Template Selection');
for (let i = 0; i < 3; i++) {
  const randomTemplate = getRandomVoiceTemplate();
  console.log(`   Random ${i + 1}: ${randomTemplate.name} (${randomTemplate.tone})`);
}

// Demo category filtering
console.log('\n📁 Demo: Templates by Category');
const urgencyTemplates = getVoiceTemplatesByCategory('urgency');
console.log(`Urgency templates: ${urgencyTemplates.map(t => t.name).join(', ')}`);

const socialProofTemplates = getVoiceTemplatesByCategory('social-proof');
console.log(`Social-proof templates: ${socialProofTemplates.map(t => t.name).join(', ')}`);

// Demo tone filtering
console.log('\n🎭 Demo: Templates by Tone');
const conversationalTemplates = getVoiceTemplatesByTone('conversational');
console.log(`Conversational templates: ${conversationalTemplates.map(t => t.name).join(', ')}`);

const directTemplates = getVoiceTemplatesByTone('straightforward');
console.log(`Straightforward templates: ${directTemplates.map(t => t.name).join(', ')}`);

console.log('\n✅ Voice Template System Demo Complete!');