/**
 * SMS Template 02: Problem Solver Approach
 * Category: solution
 * Tone: consultative
 * Character limit: ~160 characters (SMS standard)
 */

export const smsTemplate02 = {
  id: 'sms-problem-solver',
  name: 'Problem Solver Approach',
  category: 'solution',
  tone: 'consultative',
  description: 'Focuses on solving specific business problems',
  
  message: `Hi {{firstName}}, noticed {{companyName}} might face {{painPoint}}. We've helped similar {{industry}} companies solve this. Quick call? {{senderName}}`,
  
  shortMessage: `Hi {{firstName}}, help with {{painPoint}} at {{companyName}}? Quick call? {{senderName}}`,
  
  placeholders: [
    'firstName',
    'companyName',
    'painPoint',
    'industry',
    'senderName'
  ],
  
  metadata: {
    estimatedLength: 135,
    maxLength: 160,
    includesLink: false,
    callToAction: 'Quick call request',
    urgency: 'medium'
  }
};

export default smsTemplate02;