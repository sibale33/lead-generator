/**
 * SMS Lead Generation Demo
 * Demonstrates SMS functionality with Twilio integration
 */

import {
  SmsService,
  smsTemplates,
  getSmsTemplateById,
  createSmsFromTemplate,
  sendBatchSmsFromTemplates,
  getAllSmsTemplateIds,
  getAllSmsCategories,
  getAllSmsTones
} from '../index.js';

console.log('📱 SMS Lead Generation Demo\n');

// Show available SMS templates
console.log(`📋 Available SMS Templates: ${smsTemplates.length}`);
smsTemplates.forEach(template => {
  console.log(`  • ${template.id} - ${template.name} (${template.category}/${template.tone})`);
});

console.log(`\n📂 Categories: ${getAllSmsCategories().join(', ')}`);
console.log(`🎨 Tones: ${getAllSmsTones().join(', ')}\n`);

// Example lead data
const sampleLeads = [
  {
    firstName: 'John',
    lastName: 'Smith',
    companyName: 'TechCorp Inc',
    industry: 'technology',
    phone: '+1234567890',
    email: 'john@techcorp.com'
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    companyName: 'Growth Solutions',
    industry: 'consulting',
    phone: '+1987654321',
    email: 'sarah@growthsolutions.com'
  }
];

// Sender information
const senderInfo = {
  name: 'Alex',
  company: 'LeadGen Pro'
};

// Demo 1: Single SMS Template Personalization
console.log('🔧 Demo 1: SMS Template Personalization');
const expansionTemplate = getSmsTemplateById('sms-expansion');
const personalizedSms = createSmsFromTemplate(expansionTemplate, sampleLeads[0], senderInfo);

console.log(`Template: ${expansionTemplate.name}`);
console.log(`Original: ${expansionTemplate.message}`);
console.log(`Personalized: ${personalizedSms.message}`);
console.log(`Length: ${personalizedSms.length} characters\n`);

// Demo 2: SMS Service Configuration
console.log('⚙️  Demo 2: SMS Service Configuration');
const smsService = new SmsService({
  // In production, these would come from environment variables
  accountSid: process.env.TWILIO_ACCOUNT_SID || 'demo-account-sid',
  authToken: process.env.TWILIO_AUTH_TOKEN || 'demo-auth-token',
  fromNumber: process.env.TWILIO_FROM_NUMBER || '+1555000000',
  dryRun: true, // Set to false in production
  maxRetries: 3,
  retryDelay: 1000
});

console.log('SMS Service configured with:');
console.log(`  • From Number: ${smsService.config.fromNumber}`);
console.log(`  • Dry Run Mode: ${smsService.config.dryRun}`);
console.log(`  • Max Retries: ${smsService.config.maxRetries}\n`);

// Demo 3: Single SMS Send
console.log('📤 Demo 3: Single SMS Send');
try {
  const singleResult = await smsService.sendSms({
    to: sampleLeads[0].phone,
    message: personalizedSms.message
  });
  
  console.log('Single SMS Result:');
  console.log(`  • Success: ${singleResult.success}`);
  console.log(`  • Message ID: ${singleResult.messageId}`);
  console.log(`  • To: ${singleResult.to}`);
  console.log(`  • Dry Run: ${singleResult.dryRun}\n`);
} catch (error) {
  console.error('❌ Single SMS failed:', error.message);
}

// Demo 4: Batch SMS Campaign
console.log('📬 Demo 4: Batch SMS Campaign');
try {
  const batchResult = await sendBatchSmsFromTemplates(
    sampleLeads,
    [expansionTemplate, getSmsTemplateById('sms-direct')],
    senderInfo,
    {
      smsConfig: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || 'demo-account-sid',
        authToken: process.env.TWILIO_AUTH_TOKEN || 'demo-auth-token',
        fromNumber: process.env.TWILIO_FROM_NUMBER || '+1555000000',
        dryRun: true
      },
      batchSize: 5,
      delayBetweenBatches: 1000,
      templateSelector: (templates, lead) => {
        // Use expansion template for tech companies, direct for others
        return lead.industry === 'technology' ? templates[0] : templates[1];
      }
    }
  );

  console.log('Batch SMS Results:');
  console.log(`  • Total: ${batchResult.stats.total}`);
  console.log(`  • Sent: ${batchResult.stats.sent}`);
  console.log(`  • Failed: ${batchResult.stats.failed}`);
  console.log(`  • Success Rate: ${((batchResult.stats.sent / batchResult.stats.total) * 100).toFixed(1)}%`);
  console.log(`  • Total Cost: $${batchResult.stats.totalCost.toFixed(4)}`);
  console.log(`  • Duration: ${(batchResult.stats.duration / 1000).toFixed(1)}s\n`);
} catch (error) {
  console.error('❌ Batch SMS failed:', error.message);
}

// Demo 5: Template Categories and Filtering
console.log('🏷️  Demo 5: Template Categories and Filtering');
const urgentTemplates = smsTemplates.filter(t => t.tone === 'urgent');
const growthTemplates = smsTemplates.filter(t => t.category === 'growth');

console.log(`Urgent tone templates: ${urgentTemplates.map(t => t.name).join(', ')}`);
console.log(`Growth category templates: ${growthTemplates.map(t => t.name).join(', ')}\n`);

// Demo 6: Character Limit Handling
console.log('📏 Demo 6: Character Limit Handling');
const longDataLead = {
  firstName: 'Alexander',
  companyName: 'Very Long Company Name That Might Exceed Character Limits Inc',
  industry: 'enterprise software development',
  phone: '+1555123456'
};

const directTemplate = getSmsTemplateById('sms-direct');
const longPersonalized = createSmsFromTemplate(directTemplate, longDataLead, senderInfo, {
  maxLength: 160,
  preferShort: true
});

console.log(`Long data personalization:`);
console.log(`  • Message: ${longPersonalized.message}`);
console.log(`  • Length: ${longPersonalized.length} characters`);
console.log(`  • Within limit: ${longPersonalized.length <= 160 ? '✅' : '❌'}\n`);

// Demo 7: Phone Number Validation
console.log('📞 Demo 7: Phone Number Validation');
const testNumbers = [
  '+1234567890',
  '(234) 567-8901',
  '234-567-8901',
  '2345678901',
  '123', // Invalid
  '+44123456789', // International
  ''  // Empty
];

testNumbers.forEach(number => {
  const isValid = smsService.validatePhoneNumber(number);
  const formatted = isValid ? smsService.formatPhoneNumber(number) : 'N/A';
  console.log(`  • ${number || '(empty)'}: ${isValid ? '✅' : '❌'} ${formatted !== 'N/A' ? `→ ${formatted}` : ''}`);
});

console.log('\n🎉 SMS Demo completed!');
console.log('\n💡 Next Steps:');
console.log('1. Set up Twilio account and get API credentials');
console.log('2. Set environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER');
console.log('3. Set dryRun: false in production');
console.log('4. Customize SMS templates for your use case');
console.log('5. Integrate with your lead data source');