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
import { templates, getTemplateById, getAllTemplateIds } from '../src/email-templates/index.js';
import { startCallCampaign, BlandAIService, saveCampaignResults } from '../src/bland-ai-service.js';
import { startWebhookServer } from '../src/webhook-server.js';
import { runSetupCommand } from '../src/cli-setup.js';

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
    .command('coldcall <subcommand>', 'Voice AI cold-calling with Bland.ai', (yargs) => {
      return yargs
        .command('run <csv-file>', 'Start cold-calling campaign', (yargs) => {
          return yargs
            .positional('csv-file', {
              describe: 'Path to CSV file containing lead data (Name, PhoneNumber, Email)',
              type: 'string'
            })
            .option('script', {
              describe: 'Voice script template to use',
              type: 'string',
              default: 'default'
            })
            .option('batch-size', {
              describe: 'Number of calls per batch',
              type: 'number',
              default: parseInt(process.env.CALL_BATCH_SIZE) || 10
            })
            .option('delay', {
              describe: 'Delay between calls (seconds)',
              type: 'number',
              default: parseInt(process.env.CALL_DELAY_SECONDS) || 30
            })
            .option('dry-run', {
              describe: 'Simulate calling without making actual calls',
              type: 'boolean',
              default: process.env.DRY_RUN === 'true'
            })
            .option('output', {
              alias: 'o',
              describe: 'Output file for campaign results',
              type: 'string'
            });
        })
        .command('status', 'Show current call campaign status', (yargs) => {
          return yargs
            .option('campaign-id', {
              describe: 'Specific campaign ID to check',
              type: 'string'
            })
            .option('detailed', {
              alias: 'd',
              describe: 'Show detailed status information',
              type: 'boolean',
              default: false
            });
        })
        .command('report', 'Generate detailed CSV report of call outcomes', (yargs) => {
          return yargs
            .option('campaign-id', {
              describe: 'Specific campaign ID to report on',
              type: 'string'
            })
            .option('output', {
              alias: 'o',
              describe: 'Output CSV file for report',
              type: 'string',
              default: 'call-report.csv'
            })
            .option('format', {
              describe: 'Report format (csv, json)',
              type: 'string',
              choices: ['csv', 'json'],
              default: 'csv'
            });
        })
        .demandCommand(1, 'You must specify a coldcall subcommand');
    })
    .command('setup', 'Interactive configuration setup', (yargs) => {
      return yargs
        .option('config-path', {
          describe: 'Custom path for configuration file',
          type: 'string'
        })
        .option('force', {
          describe: 'Overwrite existing configuration',
          type: 'boolean',
          default: false
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
 * Handle coldcall run command
 */
async function handleColdCallRun(argv) {
  try {
    console.log(colors.green('📞 Starting cold-calling campaign...'));
    
    // Validate CSV file
    if (!fs.existsSync(argv.csvFile)) {
      console.error(colors.red(`❌ CSV file not found: ${argv.csvFile}`));
      process.exit(1);
    }

    // Process CSV file for voice calling
    console.log(colors.yellow('📄 Processing CSV file for voice calling...'));
    const { validLeads, invalidLeads, stats } = await processLeadsFromCSV(argv.csvFile, {
      requirePhone: true
    });
    
    console.log(colors.cyan(`📊 CSV Processing Results:`));
    console.log(`   Total leads: ${stats.total}`);
    console.log(`   Valid leads: ${stats.valid}`);
    console.log(`   Invalid leads: ${stats.invalid}`);

    if (validLeads.length === 0) {
      console.error(colors.red('❌ No valid leads with phone numbers found in CSV file'));
      process.exit(1);
    }

    // Initialize Bland.ai service
    const blandService = new BlandAIService();
    
    // Start webhook server
    console.log(colors.yellow('🌐 Starting webhook server...'));
    const webhookServer = await startWebhookServer();
    console.log(colors.green(`✅ Webhook server running on port ${webhookServer.port}`));

    // Configure campaign options
    const campaignOptions = {
      batchSize: argv.batchSize,
      delay: argv.delay * 1000, // Convert seconds to milliseconds
      dryRun: argv.dryRun,
      script: argv.script
    };

    if (argv.dryRun) {
      console.log(colors.magenta('🧪 DRY RUN MODE - No calls will be made'));
    }

    // Start call campaign
    console.log(colors.yellow(`📞 Starting campaign with ${validLeads.length} leads...`));
    const campaignResult = await startCallCampaign(validLeads, campaignOptions);

    // Display results
    console.log(colors.green('\n📈 Campaign Results:'));
    console.log(`   Campaign ID: ${campaignResult.campaignId}`);
    console.log(`   Total calls: ${campaignResult.totalCalls}`);
    console.log(`   Successful: ${campaignResult.successful}`);
    console.log(`   Failed: ${campaignResult.failed}`);
    console.log(`   Batches processed: ${campaignResult.batches}`);

    if (argv.dryRun) {
      console.log(colors.magenta('   (Dry run - no calls actually made)'));
    }

    // Save results if output specified
    if (argv.output) {
      await saveCampaignResults(campaignResult.campaignId, argv.output);
      console.log(colors.cyan(`💾 Results saved to: ${argv.output}`));
    }

    console.log(colors.green('✅ Cold-calling campaign completed successfully!'));
    console.log(colors.yellow('💡 Use "coldcall status" to check call progress'));
    console.log(colors.yellow('💡 Use "coldcall report" to generate detailed reports'));

  } catch (error) {
    console.error(colors.red('❌ Cold-calling campaign failed:'), error.message);
    if (argv.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Handle coldcall status command
 */
async function handleColdCallStatus(argv) {
  try {
    console.log(colors.green('📊 Cold-calling Campaign Status'));
    
    const blandService = new BlandAIService();
    
    if (argv.campaignId) {
      // Get status for specific campaign
      const status = await blandService.getCampaignStatus(argv.campaignId);
      
      console.log(colors.cyan(`\n📞 Campaign: ${argv.campaignId}`));
      console.log(`   Status: ${status.status}`);
      console.log(`   Total calls: ${status.totalCalls}`);
      console.log(`   Completed: ${status.completed}`);
      console.log(`   In progress: ${status.inProgress}`);
      console.log(`   Failed: ${status.failed}`);
      
      if (argv.detailed && status.calls) {
        console.log(colors.yellow('\n📋 Call Details:'));
        status.calls.slice(0, 10).forEach((call, index) => {
          console.log(`   ${index + 1}. ${call.phoneNumber} - ${call.status} (${call.duration || 'N/A'}s)`);
        });
        
        if (status.calls.length > 10) {
          console.log(`   ... and ${status.calls.length - 10} more calls`);
        }
      }
    } else {
      // Get status for all recent campaigns
      const campaigns = await blandService.getRecentCampaigns();
      
      if (campaigns.length === 0) {
        console.log(colors.yellow('No recent campaigns found.'));
        return;
      }
      
      console.log(colors.cyan('\n📞 Recent Campaigns:'));
      campaigns.forEach((campaign, index) => {
        console.log(`   ${index + 1}. ${campaign.id} - ${campaign.status} (${campaign.totalCalls} calls)`);
        console.log(`      Created: ${new Date(campaign.createdAt).toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error(colors.red('❌ Failed to get campaign status:'), error.message);
    if (argv.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Handle coldcall report command
 */
async function handleColdCallReport(argv) {
  try {
    console.log(colors.green('📊 Generating Cold-calling Report...'));
    
    const blandService = new BlandAIService();
    
    // Get campaign data
    let campaigns;
    if (argv.campaignId) {
      const campaign = await blandService.getCampaignDetails(argv.campaignId);
      campaigns = [campaign];
    } else {
      campaigns = await blandService.getRecentCampaigns();
    }

    if (campaigns.length === 0) {
      console.log(colors.yellow('No campaigns found to report on.'));
      return;
    }

    // Generate report data
    const reportData = [];
    for (const campaign of campaigns) {
      const details = await blandService.getCampaignDetails(campaign.id);
      
      for (const call of details.calls || []) {
        reportData.push({
          campaignId: campaign.id,
          phoneNumber: call.phoneNumber,
          name: call.name || 'Unknown',
          email: call.email || '',
          status: call.status,
          duration: call.duration || 0,
          outcome: call.outcome || 'unknown',
          ivrChoice: call.ivrChoice || 'none',
          timestamp: call.timestamp || campaign.createdAt,
          cost: call.cost || 0
        });
      }
    }

    // Save report
    if (argv.format === 'json') {
      const jsonReport = {
        generatedAt: new Date().toISOString(),
        totalCampaigns: campaigns.length,
        totalCalls: reportData.length,
        summary: {
          completed: reportData.filter(r => r.status === 'completed').length,
          failed: reportData.filter(r => r.status === 'failed').length,
          pressedOne: reportData.filter(r => r.ivrChoice === '1').length,
          pressedTwo: reportData.filter(r => r.ivrChoice === '2').length
        },
        calls: reportData
      };
      
      fs.writeFileSync(argv.output, JSON.stringify(jsonReport, null, 2));
    } else {
      // CSV format
      const csvHeader = 'Campaign ID,Phone Number,Name,Email,Status,Duration (s),Outcome,IVR Choice,Timestamp,Cost ($)\n';
      const csvRows = reportData.map(row =>
        `${row.campaignId},${row.phoneNumber},"${row.name}","${row.email}",${row.status},${row.duration},${row.outcome},${row.ivrChoice},${row.timestamp},${row.cost}`
      ).join('\n');
      
      fs.writeFileSync(argv.output, csvHeader + csvRows);
    }

    // Display summary
    console.log(colors.green('\n📈 Report Summary:'));
    console.log(`   Total campaigns: ${campaigns.length}`);
    console.log(`   Total calls: ${reportData.length}`);
    console.log(`   Completed calls: ${reportData.filter(r => r.status === 'completed').length}`);
    console.log(`   Failed calls: ${reportData.filter(r => r.status === 'failed').length}`);
    console.log(`   Pressed 1 (interested): ${reportData.filter(r => r.ivrChoice === '1').length}`);
    console.log(`   Pressed 2 (opt-out): ${reportData.filter(r => r.ivrChoice === '2').length}`);
    
    console.log(colors.cyan(`💾 Report saved to: ${argv.output}`));

  } catch (error) {
    console.error(colors.red('❌ Failed to generate report:'), error.message);
    if (argv.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Handle setup command
 */
async function handleSetupCommand(argv) {
  try {
    console.log(colors.green('⚙️  Lead Generator Setup'));
    
    // Check if config already exists and warn user
    if (!argv.force) {
      const { getConfigPath, loadConfig, getDefaultConfig } = await import('../src/config-manager.js');
      const configPath = argv.configPath || getConfigPath();
      const existingConfig = loadConfig(configPath);
      const defaultConfig = getDefaultConfig();
      
      // Check if config has been customized (not just defaults)
      const hasCustomConfig = JSON.stringify(existingConfig) !== JSON.stringify(defaultConfig);
      
      if (hasCustomConfig) {
        console.log(colors.yellow('⚠️  Existing configuration found.'));
        console.log(colors.yellow('   Use --force to overwrite existing configuration.'));
        console.log(colors.cyan(`   Config location: ${configPath}`));
        process.exit(0);
      }
    }
    
    // Run setup
    const result = await runSetupCommand(argv.configPath);
    
    if (!result.success) {
      if (result.cancelled) {
        console.log(colors.yellow('Setup cancelled by user.'));
        process.exit(0);
      } else {
        console.error(colors.red(`Setup failed: ${result.error}`));
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error(colors.red('❌ Setup failed:'), error.message);
    if (argv.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
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
      case 'coldcall':
        // Handle coldcall subcommands
        switch (argv._[1]) {
          case 'run':
            await handleColdCallRun(argv);
            break;
          case 'status':
            await handleColdCallStatus(argv);
            break;
          case 'report':
            await handleColdCallReport(argv);
            break;
          default:
            console.error(colors.red('Unknown coldcall subcommand. Use: run, status, or report'));
            process.exit(1);
        }
        break;
      case 'setup':
        await handleSetupCommand(argv);
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