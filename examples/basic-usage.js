/**
 * Basic Usage Example
 * Demonstrates how to use the Lead Generator as a Node.js module
 */

import { LeadGenerator, quickStart } from '../index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Example 1: Quick Start - Simplest way to run a campaign
 */
async function quickStartExample() {
  console.log('🚀 Quick Start Example');
  console.log('='.repeat(50));

  try {
    const results = await quickStart('./examples/sample-leads.csv', {
      // Configuration (can also be set via environment variables)
      mailgunApiKey: process.env.MAILGUN_API_KEY,
      mailgunDomain: process.env.MAILGUN_DOMAIN,
      openaiApiKey: process.env.OPENAI_API_KEY,
      
      // Sender information
      senderName: 'John Smith',
      senderEmail: 'john@company.com',
      senderTitle: 'Sales Director',
      
      // Campaign settings
      templateId: 'expansion', // Use specific template
      dryRun: true, // Don't actually send emails
      batchSize: 5,
      delay: 1000
    });

    console.log('✅ Campaign completed!');
    console.log(`📊 Results: ${results.sending.successful} sent, ${results.sending.failed} failed`);
    console.log(`📈 Success rate: ${results.sending.successRate}%`);

  } catch (error) {
    console.error('❌ Campaign failed:', error.message);
  }
}

/**
 * Example 2: Full LeadGenerator Class Usage
 */
async function fullExample() {
  console.log('\n🏗️ Full LeadGenerator Example');
  console.log('='.repeat(50));

  try {
    // Initialize LeadGenerator with configuration
    const generator = new LeadGenerator({
      // Mailgun settings
      mailgunApiKey: process.env.MAILGUN_API_KEY,
      mailgunDomain: process.env.MAILGUN_DOMAIN,
      
      // OpenAI settings
      openaiApiKey: process.env.OPENAI_API_KEY,
      openaiModel: 'gpt-4o-mini',
      
      // Sender information
      senderName: 'Jane Doe',
      senderEmail: 'jane@company.com',
      senderTitle: 'VP of Sales',
      
      // Campaign settings
      batchSize: 3,
      delay: 2000,
      enablePersonalization: true,
      trackOpens: true,
      trackClicks: true
    });

    // Validate configuration
    const validation = generator.validateConfig();
    if (!validation.isValid) {
      console.error('❌ Configuration errors:', validation.errors);
      return;
    }
    console.log('✅ Configuration validated');

    // Preview an email before sending
    console.log('\n📧 Email Preview:');
    const preview = await generator.previewEmail('social-proof', {
      FirstName: 'John',
      LastName: 'Doe',
      Company: 'Acme Corp',
      Industry: 'Technology',
      Title: 'CTO'
    });
    
    console.log('Subject:', preview.subject);
    console.log('Body preview:', preview.body.substring(0, 200) + '...');

    // Run the campaign
    console.log('\n🚀 Running campaign...');
    const results = await generator.runCampaign('./examples/sample-leads.csv', {
      templateId: 'problem-solver',
      dryRun: true // Set to false to actually send emails
    });

    // Display detailed results
    console.log('\n📊 Detailed Results:');
    console.log('CSV Processing:', results.csvProcessing.stats);
    console.log('Personalization:', results.personalization);
    console.log('Email Sending:', results.sending);
    console.log('Summary:', results.summary);

  } catch (error) {
    console.error('❌ Full example failed:', error.message);
  }
}

/**
 * Example 3: Individual Module Usage
 */
async function individualModulesExample() {
  console.log('\n🔧 Individual Modules Example');
  console.log('='.repeat(50));

  try {
    // Import individual modules
    const { processLeadsFromCSV } = await import('../src/csv-parser.js');
    const { getTemplateById } = await import('../src/email-templates/index.js');
    const { personalizeTemplate } = await import('../src/ai-service.js');

    // Process CSV file
    console.log('📄 Processing CSV...');
    const csvResults = await processLeadsFromCSV('./examples/sample-leads.csv');
    console.log(`Found ${csvResults.validLeads.length} valid leads`);

    // Get a template
    const template = getTemplateById('curiosity');
    console.log(`📧 Using template: ${template.name}`);

    // Personalize for first lead
    if (csvResults.validLeads.length > 0) {
      const firstLead = csvResults.validLeads[0];
      console.log(`👤 Personalizing for: ${firstLead.FirstName} at ${firstLead.Company}`);

      const personalizedEmail = await personalizeTemplate(
        template,
        firstLead,
        { name: 'Sales Rep', email: 'sales@company.com' },
        { fallbackToBasic: true }
      );

      console.log('✅ Personalized email created');
      console.log('Subject:', personalizedEmail.subject);
      console.log('Personalization type:', personalizedEmail.personalizationType);
    }

  } catch (error) {
    console.error('❌ Individual modules example failed:', error.message);
  }
}

/**
 * Example 4: Template Management
 */
async function templateManagementExample() {
  console.log('\n📝 Template Management Example');
  console.log('='.repeat(50));

  try {
    const generator = new LeadGenerator();

    // Get all templates
    const allTemplates = generator.getTemplates();
    console.log(`📚 Total templates available: ${allTemplates.length}`);

    // Filter by category
    const growthTemplates = generator.getTemplates({ category: 'growth' });
    console.log(`🌱 Growth templates: ${growthTemplates.length}`);

    // Filter by tone
    const professionalTemplates = generator.getTemplates({ tone: 'professional' });
    console.log(`💼 Professional tone templates: ${professionalTemplates.length}`);

    // List all template details
    console.log('\n📋 Available Templates:');
    allTemplates.forEach(template => {
      console.log(`  • ${template.id} - ${template.name} (${template.category}/${template.tone})`);
    });

  } catch (error) {
    console.error('❌ Template management example failed:', error.message);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('🎯 Lead Generator Examples');
  console.log('=' .repeat(60));
  
  // Check if required environment variables are set
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.log('⚠️  Note: MAILGUN_API_KEY and MAILGUN_DOMAIN not set');
    console.log('   Examples will run in simulation mode');
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  Note: OPENAI_API_KEY not set');
    console.log('   AI personalization will fall back to basic mode');
  }

  console.log('');

  // Run examples
  await quickStartExample();
  await fullExample();
  await individualModulesExample();
  await templateManagementExample();

  console.log('\n✨ All examples completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Set up your .env file with API keys');
  console.log('   2. Prepare your CSV file with lead data');
  console.log('   3. Run: lead-generator send your-leads.csv');
  console.log('   4. Or use the programmatic API in your Node.js project');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}

export {
  quickStartExample,
  fullExample,
  individualModulesExample,
  templateManagementExample,
  runExamples
};