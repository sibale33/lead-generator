/**
 * SMS Template 04: Direct Value Proposition
 * Category: direct
 * Tone: straightforward
 * Character limit: ~160 characters (SMS standard)
 */

export const smsTemplate04 = {
  id: 'sms-direct',
  name: 'Direct Value Proposition',
  category: 'direct',
  tone: 'straightforward',
  description: 'Straight to the point with clear value proposition',
  
  message: `{{firstName}}, we help {{industry}} companies save {{savings}} on {{service}}. Worth a 10-min call for {{companyName}}? {{senderName}} - {{senderCompany}}`,
  
  shortMessage: `{{firstName}}, save {{savings}} on {{service}}. 10-min call? {{senderName}} - {{senderCompany}}`,
  
  placeholders: [
    'firstName',
    'companyName',
    'industry',
    'savings',
    'service',
    'senderName',
    'senderCompany'
  ],
  
  metadata: {
    estimatedLength: 125,
    maxLength: 160,
    includesLink: false,
    callToAction: '10-min call',
    urgency: 'low'
  }
};

export default smsTemplate04;