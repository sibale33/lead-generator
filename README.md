# Lead Generator

A powerful CLI tool and Node.js module for sending mass lead emails with AI-powered personalization. Built for sales teams who want to scale their outreach while maintaining personalization and professionalism.

## Features

- 📧 **Mass Email Campaigns** - Send personalized emails to hundreds of leads
- 🤖 **AI Personalization** - OpenAI-powered template customization
- 📊 **CSV Processing** - Import leads from CSV files with validation
- 🎯 **Smart Templates** - 10 pre-built sales email templates
- 📈 **Batch Processing** - Configurable batch sizes with rate limiting
- 🔍 **Email Validation** - Comprehensive lead data validation
- 📞 **Voice AI Ready** - Stub implementation for future Twilio integration
- 🛠️ **CLI & Module** - Use as command-line tool or Node.js module

## Installation

### Using pnpm (recommended)
```bash
pnpm install @profullstack/lead-generator
```

### Using npm
```bash
npm install @profullstack/lead-generator
```

### Global Installation (for CLI usage)
```bash
pnpm install -g @profullstack/lead-generator
```

## Quick Start

### 1. Environment Setup

Create a `.env` file with your API keys:

```bash
# Mailgun Configuration (Required)
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=your_mailgun_domain_here

# OpenAI Configuration (Required for AI personalization)
OPENAI_API_KEY=your_openai_api_key_here

# Sender Information
DEFAULT_FROM_EMAIL=your_name@your_domain.com
DEFAULT_FROM_NAME=Your Name
```

### 2. Prepare Your CSV File

Your CSV file should include these columns:
- `FirstName` (required)
- `LastName` (optional)
- `Company` (required)
- `WorkEmail` (required if PersonalEmail not provided)
- `PersonalEmail` (required if WorkEmail not provided)
- `Phone` (optional, for future voice features)
- `Industry` (optional, helps with personalization)
- `Title` (optional, helps with personalization)

Example CSV:
```csv
FirstName,LastName,Company,WorkEmail,PersonalEmail,Phone,Industry,Title
John,Doe,Acme Corp,john.doe@acme.com,john@personal.com,555-0123,Technology,CTO
Jane,Smith,Beta Inc,jane.smith@beta.com,,555-0456,Healthcare,VP Engineering
```

### 3. Send Your First Campaign

```bash
# Using CLI
lead-generator send leads.csv --template expansion --sender-name "Your Name"

# Or using the short alias
lg send leads.csv -t expansion
```

## CLI Usage

### Commands

#### Send Campaign
```bash
lead-generator send <csv-file> [options]

Options:
  --template, -t          Template ID or "random" (default: "random")
  --sender-name          Sender name
  --sender-email         Sender email
  --sender-title         Sender title (default: "Sales Director")
  --batch-size           Emails per batch (default: 300)
  --delay                Delay between batches in ms (default: 1000)
  --dry-run              Simulate without sending (default: false)
  --ai-personalization   Enable AI personalization (default: true)
  --output, -o           Save results to file
```

#### List Templates
```bash
lead-generator templates [options]

Options:
  --category, -c         Filter by category
  --tone                 Filter by tone
  --details, -d          Show template details
```

#### Validate CSV
```bash
lead-generator validate <csv-file> [options]

Options:
  --output, -o           Save validation report to file
```

#### Voice AI Status
```bash
lead-generator voice <csv-file>
```

### Examples

```bash
# Send campaign with specific template
lead-generator send leads.csv --template problem-solver --dry-run

# List all templates with details
lead-generator templates --details

# Validate CSV file
lead-generator validate leads.csv --output validation-report.json

# Send campaign and save results
lead-generator send leads.csv -t expansion -o campaign-results.json
```

## Node.js Module Usage

### Basic Usage

```javascript
import { LeadGenerator } from '@profullstack/lead-generator';

const generator = new LeadGenerator({
  mailgunApiKey: 'your-api-key',
  mailgunDomain: 'your-domain.com',
  openaiApiKey: 'your-openai-key',
  senderName: 'Your Name',
  senderEmail: 'you@company.com'
});

// Run complete campaign
const results = await generator.runCampaign('leads.csv', {
  templateId: 'expansion',
  dryRun: false
});

console.log(`Sent ${results.sending.successful} emails`);
```

### Quick Start Function

```javascript
import { quickStart } from '@profullstack/lead-generator';

const results = await quickStart('leads.csv', {
  mailgunApiKey: 'your-api-key',
  mailgunDomain: 'your-domain.com',
  senderName: 'Your Name',
  senderEmail: 'you@company.com',
  templateId: 'social-proof'
});
```

### Individual Module Usage

```javascript
import { 
  processLeadsFromCSV, 
  personalizeTemplate, 
  sendBatchEmails,
  getTemplateById 
} from '@profullstack/lead-generator';

// Process CSV
const { validLeads } = await processLeadsFromCSV('leads.csv');

// Get template
const template = getTemplateById('expansion');

// Personalize emails
const personalizedEmails = await batchPersonalize(
  [template], 
  validLeads, 
  { name: 'Your Name', email: 'you@company.com' }
);

// Send emails
const results = await sendBatchEmails(emailsToSend, {
  apiKey: 'your-mailgun-key',
  domain: 'your-domain.com'
});
```

## Available Templates

| ID | Name | Category | Tone | Use Case |
|----|------|----------|------|----------|
| `expansion` | Team Expansion Focus | growth | professional | When prospect is expanding |
| `problem-solver` | Problem Solver | solution | consultative | Addressing pain points |
| `social-proof` | Social Proof | social-proof | confident | Leveraging success stories |
| `curiosity` | Curiosity Gap | curiosity | intriguing | Creating intrigue |
| `direct` | Direct Value Prop | direct | straightforward | Clear value proposition |
| `question` | Question-Based | engagement | conversational | Engaging with questions |
| `referral` | Referral/Connection | referral | warm | Mutual connections |
| `urgency` | Urgency/Scarcity | urgency | urgent | Time-sensitive offers |
| `insight` | Industry Insight | insight | informative | Sharing insights |
| `follow-up` | Follow-up | follow-up | respectful | Re-engagement |

## Configuration

### Environment Variables

```bash
# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_BASE_URL=https://api.mailgun.net

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# Email Configuration
DEFAULT_FROM_EMAIL=your_email@domain.com
DEFAULT_FROM_NAME=Your Name
DEFAULT_REPLY_TO=your_reply@domain.com

# Batch Processing
BATCH_SIZE=300
BATCH_DELAY_MS=1000
MAX_RETRIES=3

# Features
PERSONALIZATION_ENABLED=true
DRY_RUN=false
```

### Programmatic Configuration

```javascript
const generator = new LeadGenerator({
  // Mailgun settings
  mailgunApiKey: 'your-key',
  mailgunDomain: 'your-domain.com',
  
  // OpenAI settings
  openaiApiKey: 'your-key',
  openaiModel: 'gpt-4',
  
  // Sender info
  senderName: 'Your Name',
  senderEmail: 'you@company.com',
  senderTitle: 'Sales Director',
  
  // Campaign settings
  batchSize: 100,
  delay: 2000,
  enablePersonalization: true,
  trackOpens: true,
  trackClicks: true
});
```

## API Reference

### LeadGenerator Class

#### Constructor
```javascript
new LeadGenerator(config)
```

#### Methods
- `runCampaign(csvFilePath, options)` - Run complete campaign
- `validateConfig()` - Validate configuration
- `getTemplates(filters)` - Get available templates
- `previewEmail(templateId, leadData)` - Preview personalized email

### Functions

- `quickStart(csvFilePath, config)` - Quick campaign setup
- `processLeadsFromCSV(filePath)` - Process CSV file
- `personalizeTemplate(template, leadData, senderInfo)` - Personalize single template
- `sendBatchEmails(emails, options)` - Send email batch
- `getTemplateById(id)` - Get template by ID

## Testing

Run the test suite:

```bash
# Run all tests
pnpm test

# Run specific test files
pnpm test:csv
pnpm test:email
pnpm test:ai

# Run with coverage
pnpm test --coverage
```

## Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/profullstack/lead-generator.git
cd lead-generator

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your API keys
```

### Project Structure

```
lead-generator/
├── bin/
│   └── lead-generator.js     # CLI entry point
├── src/
│   ├── templates/            # Email templates
│   ├── csv-parser.js         # CSV processing
│   ├── ai-service.js         # OpenAI integration
│   ├── email-service.js      # Mailgun integration
│   └── voice-service.js      # Voice AI stub
├── test/                     # Test files
├── index.js                  # Main module export
└── package.json
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Implement the feature
5. Run tests and ensure they pass
6. Submit a pull request

## Troubleshooting

### Common Issues

**"Mailgun API key is required"**
- Ensure `MAILGUN_API_KEY` is set in your `.env` file
- Verify the API key is correct in your Mailgun dashboard

**"No valid leads found"**
- Check your CSV file format
- Ensure required columns (`FirstName`, `Company`) are present
- Verify at least one email field (`WorkEmail` or `PersonalEmail`) has valid data

**"Rate limit exceeded"**
- Increase the delay between batches with `--delay` option
- Reduce batch size with `--batch-size` option
- Check your Mailgun sending limits

**AI personalization fails**
- Verify `OPENAI_API_KEY` is set correctly
- Check your OpenAI account has sufficient credits
- Use `--ai-personalization false` to disable AI features

### Debug Mode

Enable verbose logging:

```bash
lead-generator send leads.csv --verbose
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@profullstack.com
- 🐛 Issues: [GitHub Issues](https://github.com/profullstack/lead-generator/issues)
- 📖 Documentation: [Full Documentation](https://profullstack.com/docs/lead-generator)

## Roadmap

- [ ] Voice AI implementation with Twilio
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Advanced analytics and reporting
- [ ] A/B testing for templates
- [ ] Webhook support for email events
- [ ] Template builder UI
- [ ] Multi-language support