/**
 * SMS Template 03: Social Proof Approach
 * Category: social-proof
 * Tone: confident
 * Character limit: ~160 characters (SMS standard)
 */

export const smsTemplate03 = {
  id: 'sms-social-proof',
  name: 'Social Proof Approach',
  category: 'social-proof',
  tone: 'confident',
  description: 'Leverages success stories and client testimonials',
  
  message: `Hi {{firstName}}, just helped {{similarCompany}} increase {{metric}} by {{percentage}}%. Think {{companyName}} could benefit too. Chat? {{senderName}}`,
  
  shortMessage: `Hi {{firstName}}, helped {{similarCompany}} boost {{metric}} {{percentage}}%. Chat about {{companyName}}? {{senderName}}`,
  
  placeholders: [
    'firstName',
    'companyName',
    'similarCompany',
    'metric',
    'percentage',
    'senderName'
  ],
  
  metadata: {
    estimatedLength: 145,
    maxLength: 160,
    includesLink: false,
    callToAction: 'Chat request',
    urgency: 'medium'
  }
};

export default smsTemplate03;