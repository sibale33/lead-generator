/**
 * SMS Template 05: Urgency/Scarcity Approach
 * Category: urgency
 * Tone: urgent
 * Character limit: ~160 characters (SMS standard)
 */

export const smsTemplate05 = {
  id: 'sms-urgency',
  name: 'Urgency/Scarcity Approach',
  category: 'urgency',
  tone: 'urgent',
  description: 'Creates urgency with limited-time offers or opportunities',
  
  message: `{{firstName}}, limited spots for {{offer}} ending {{deadline}}. {{companyName}} could benefit. Quick call today? {{senderName}}`,
  
  shortMessage: `{{firstName}}, {{offer}} ends {{deadline}}. Quick call for {{companyName}}? {{senderName}}`,
  
  placeholders: [
    'firstName',
    'companyName',
    'offer',
    'deadline',
    'senderName'
  ],
  
  metadata: {
    estimatedLength: 130,
    maxLength: 160,
    includesLink: false,
    callToAction: 'Quick call today',
    urgency: 'high'
  }
};

export default smsTemplate05;