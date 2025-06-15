#!/usr/bin/env node

/**
 * @profullstack/lead-generator - Command-line interface
 */

import fs from 'fs';
import path from 'path';
import colors from 'ansi-colors';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import cliProgress from 'cli-progress';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import core modules
import { processLeadsFromCSV } from '../src/csv-parser.js';
import { personalizeTemplate, batchPersonalize } from '../src/ai-service.js';
import { sendBatchEmails, createEmailFromTemplate } from '../src/email-service.js';
import { getVoiceServiceStatus } from '../src/voice-service.js';
import { templates, getTemplateById, getAllTemplateIds } from '../src/templates/index.js';

/**
 * Configure command line arguments
 */
function configureCommandLine() {
  return yargs(hideBin(process.argv))
    .scriptName('lead-generator')
    .usage('$0 <command> [options]')
    .command('send <csv-file>', 'Send mass emails from CSV file', (yargs) => {
      return yargs
        .positional('csv-file', {
          describe: 'Path to CSV file containing lead data',
          type: 'string'
        })
        .option('template', {
          alias: 't',
          describe: 'Template ID to use (or "random" for random selection)',
          type: 'string',
          default: 'random'
        })
        .option('sender-name', {
          describe: 'Sender name',
          type: 'string',
          default: process.env.DEFAULT_FROM_NAME
        })
        .option('sender-email', {
          describe: 'Sender email',
          type: 'string',
          default: process.env.DEFAULT_FROM_EMAIL
        })
        .option('sender-title', {
          describe: 'Sender title',
          type: 'string',
          default: 'Sales Director'
        })
        .option('batch-size', {
          describe: 'Number of emails per batch',
          type: 'number',
          default: parseInt(process.env.BATCH_SIZE) || 300
        })
        .option('delay', {
          describe: 'Delay between batches (ms)',
          type: 'number',
          default: parseInt(process.env.BATCH_DELAY_MS) || 1000
        })
        .option('dry-run', {
          describe: 'Simulate sending without actually sending emails',
          type: 'boolean',
          default: process.env.DRY_RUN === 'true'
        })
        .option('ai-personalization', {
          describe: 'Enable AI-powered personalization',
          type: 'boolean',
          default: process.env.PERSONALIZATION_ENABLED !== 'false'
        })
        .option('output', {
          alias: 'o',
          describe: 'Output file for results',
          type: 'string'
        });
    })
    .command('templates', 'List available email templates', (yargs) => {
      return yargs
        .option('category', {
          alias: 'c',
          describe: 'Filter by category',
          type: 'string'
        })
        .option('tone', {
          describe: 'Filter by tone',
          type: 'string'
        })
        .option('details', {
          alias: 'd',
          describe: 'Show template details',
          type: 'boolean',
          default: false
        });
    })
    .command('validate <csv-file>', 'Validate CSV file format and data', (yargs) => {
      return yargs
        .positional('csv-file', {
          describe: 'Path to CSV file to validate',
          type: 'string'
        })
        .option('output', {
          alias: 'o',
          describe: 'Output validation report to file',
          type: 'string'
        });
    })
    .command('voice <csv-file>', 'Voice AI calls (stub - not implemented)', (yargs) => {
      return yargs
        .positional('csv-file', {
          describe: 'Path to CSV file containing lead data',
          type: 'string'
        })
        .option('script', {
          describe: 'Voice script template',
          type: 'string',
          default: 'default'
        });
    })
    .option('verbose', {
      alias: 'v',
      describe: 'Enable verbose logging',
      type: 'boolean',
      default: false
    })
    .option('config', {
      describe: 'Path to configuration file',
      type: 'string'
    })
    .help()
    .alias('help', 'h')
    .version()
    .alias('version', 'V')
    .demandCommand(1, 'You must specify a command')
    .strict();
}

/**
 * Handle send command
 */
async function handleSendCommand(argv) {
  try {
    console.log(colors.green('🚀 Starting lead email campaign...'));
    
    // Validate CSV file
    if (!fs.existsSync(argv.csvFile)) {
      console.error(colors.red(`❌ CSV file not found: ${argv.csvFile}`));
      process.exit(1);
    }

    // Process CSV file
    console.log(colors.yellow('📄 Processing CSV file...'));
    const { validLeads, invalidLeads, stats } = await processLeadsFromCSV(argv.csvFile);
    
    console.log(colors.cyan(`📊 CSV Processing Results:`));
    console.log(`   Total leads: ${stats.total}`);
    console.log(`   Valid leads: ${stats.valid}`);
    console.log(`   Invalid leads: ${stats.invalid}`);
    console.log(`   Work emails: ${stats.workEmails}`);
    console.log(`   Personal emails: ${stats.personalEmails}`);

    if (validLeads.length === 0) {
      console.error(colors.red('❌ No valid leads found in CSV file'));
      process.exit(1);
    }

    // Prepare sender information
    const senderInfo = {
      name: argv.senderName,
      email: argv.senderEmail,
      title: argv.senderTitle
    };

    // Select template(s)
    let selectedTemplates;
    if (argv.template === 'random') {
      selectedTemplates = templates;
    } else {
      const template = getTemplateById(argv.template);
      if (!template) {
        console.error(colors.red(`❌ Template not found: ${argv.template}`));
        console.log(colors.yellow(`Available templates: ${getAllTemplateIds().join(', ')}`));
        process.exit(1);
      }
      selectedTemplates = [template];
    }

    // Personalize emails
    console.log(colors.yellow('🤖 Personalizing email templates...'));
    const personalizationOptions = {
      fallbackToBasic: true,
      batchSize: 10,
      delay: 500
    };

    if (!argv.aiPersonalization) {
      console.log(colors.yellow('⚠️  AI personalization disabled, using basic personalization'));
    }

    const personalizedResults = await batchPersonalize(
      selectedTemplates,
      validLeads,
      senderInfo,
      personalizationOptions
    );

    const successfulPersonalizations = personalizedResults.filter(r => r.success);
    console.log(colors.cyan(`✅ Personalized ${successfulPersonalizations.length} emails`));

    // Create email data for sending
    const emailsToSend = successfulPersonalizations.map(result => {
      return createEmailFromTemplate(
        result.email,
        result.lead,
        senderInfo,
        {
          trackOpens: true,
          trackClicks: true
        }
      );
    });

    // Send emails
    console.log(colors.yellow(`📧 Sending ${emailsToSend.length} emails...`));
    
    if (argv.dryRun) {
      console.log(colors.magenta('🧪 DRY RUN MODE - No emails will be sent'));
    }

    const sendOptions = {
      batchSize: argv.batchSize,
      delay: argv.delay,
      dryRun: argv.dryRun,
      maxRetries: 3
    };

    const sendResults = await sendBatchEmails(emailsToSend, sendOptions);

    // Display results
    console.log(colors.green('\n📈 Campaign Results:'));
    console.log(`   Total emails: ${sendResults.total}`);
    console.log(`   Successful: ${sendResults.successful} (${sendResults.successRate}%)`);
    console.log(`   Failed: ${sendResults.failed}`);
    console.log(`   Batches processed: ${sendResults.batches}`);

    if (argv.dryRun) {
      console.log(colors.magenta('   (Dry run - no emails actually sent)'));
    }

    // Save results if output specified
    if (argv.output) {
      const results = {
        campaign: {
          timestamp: new Date().toISOString(),
          csvFile: argv.csvFile,
          template: argv.template,
          dryRun: argv.dryRun
        },
        csvStats: stats,
        personalization: {
          total: personalizedResults.length,
          successful: successfulPersonalizations.length,
          failed: personalizedResults.length - successfulPersonalizations.length
        },
        sending: sendResults
      };

      fs.writeFileSync(argv.output, JSON.stringify(results, null, 2));
      console.log(colors.cyan(`💾 Results saved to: ${argv.output}`));
    }

    console.log(colors.green('✅ Campaign completed successfully!'));

  } catch (error) {
    console.error(colors.red('❌ Campaign failed:'), error.message);
    if (argv.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Handle templates command
 */
async function handleTemplatesCommand(argv) {
  console.log(colors.green('📧 Available Email Templates:'));
  console.log('');

  let templatesToShow = templates;

  // Filter by category or tone if specified
  if (argv.category) {
    templatesToShow = templates.filter(t => t.category === argv.category);
  }
  if (argv.tone) {
    templatesToShow = templates.filter(t => t.tone === argv.tone);
  }

  if (templatesToShow.length === 0) {
    console.log(colors.yellow('No templates found matching the criteria.'));
    return;
  }

  for (const template of templatesToShow) {
    console.log(colors.cyan(`📄 ${template.id} - ${template.name}`));
    console.log(`   Category: ${template.category} | Tone: ${template.tone}`);
    
    if (argv.details) {
      console.log(`   Subject: ${template.subject}`);
      console.log(`   Placeholders: ${template.placeholders.join(', ')}`);
      console.log(`   Body preview: ${template.body.substring(0, 100)}...`);
    }
    console.log('');
  }

  console.log(colors.green(`Total templates: ${templatesToShow.length}`));
}

/**
 * Handle validate command
 */
async function handleValidateCommand(argv) {
  try {
    console.log(colors.yellow('🔍 Validating CSV file...'));
    
    const { validLeads, invalidLeads, stats } = await processLeadsFromCSV(argv.csvFile);
    
    console.log(colors.green('\n✅ Validation Results:'));
    console.log(`   Total rows: ${stats.total}`);
    console.log(`   Valid leads: ${stats.valid}`);
    console.log(`   Invalid leads: ${stats.invalid}`);
    console.log(`   Work emails: ${stats.workEmails}`);
    console.log(`   Personal emails: ${stats.personalEmails}`);

    if (invalidLeads.length > 0) {
      console.log(colors.red('\n❌ Invalid leads found:'));
      invalidLeads.slice(0, 5).forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.FirstName || 'Unknown'} - ${lead.validation.errors.join(', ')}`);
      });
      
      if (invalidLeads.length > 5) {
        console.log(`   ... and ${invalidLeads.length - 5} more`);
      }
    }

    if (argv.output) {
      const report = {
        validation: {
          timestamp: new Date().toISOString(),
          file: argv.csvFile,
          stats,
          validLeads: validLeads.length,
          invalidLeads: invalidLeads.map(lead => ({
            data: lead,
            errors: lead.validation.errors
          }))
        }
      };

      fs.writeFileSync(argv.output, JSON.stringify(report, null, 2));
      console.log(colors.cyan(`💾 Validation report saved to: ${argv.output}`));
    }

  } catch (error) {
    console.error(colors.red('❌ Validation failed:'), error.message);
    process.exit(1);
  }
}

/**
 * Handle voice command (stub)
 */
async function handleVoiceCommand(argv) {
  console.log(colors.yellow('📞 Voice AI Service Status:'));
  
  const status = getVoiceServiceStatus();
  console.log(`   Implementation: ${status.implemented ? '✅ Ready' : '🚧 Not implemented'}`);
  console.log(`   Status: ${status.message}`);
  
  if (status.plannedFeatures) {
    console.log('\n🔮 Planned Features:');
    status.plannedFeatures.forEach(feature => {
      console.log(`   • ${feature}`);
    });
  }

  console.log(colors.magenta('\n📞 This feature will be available in a future release.'));
}

/**
 * Main function
 */
async function main() {
  try {
    const argv = configureCommandLine().argv;

    // Handle different commands
    switch (argv._[0]) {
      case 'send':
        await handleSendCommand(argv);
        break;
      case 'templates':
        await handleTemplatesCommand(argv);
        break;
      case 'validate':
        await handleValidateCommand(argv);
        break;
      case 'voice':
        await handleVoiceCommand(argv);
        break;
      default:
        console.error(colors.red('Unknown command'));
        process.exit(1);
    }

  } catch (error) {
    console.error(colors.red('Unhandled error:'), error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(colors.red('Fatal error:'), error);
  process.exit(1);
});