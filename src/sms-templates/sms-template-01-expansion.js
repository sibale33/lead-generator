/**
 * SMS Template 01: Team Expansion Focus
 * Category: growth
 * Tone: professional
 * Character limit: ~160 characters (SMS standard)
 */

export const smsTemplate01 = {
  id: 'sms-expansion',
  name: 'Team Expansion Focus',
  category: 'growth',
  tone: 'professional',
  description: 'Direct approach focusing on team growth and expansion needs',
  
  // SMS templates should be concise due to character limits
  message: `Hi {{firstName}}, I help {{industry}} companies like {{companyName}} scale their teams efficiently. Quick 5-min chat about your growth plans? {{senderName}} - {{senderCompany}}`,
  
  // Alternative shorter version for strict character limits
  shortMessage: `Hi {{firstName}}, help {{industry}} companies scale teams. 5-min chat? {{senderName}} - {{senderCompany}}`,
  
  // Placeholders that can be personalized
  placeholders: [
    'firstName',
    'companyName', 
    'industry',
    'senderName',
    'senderCompany'
  ],
  
  // SMS-specific metadata
  metadata: {
    estimatedLength: 140,
    maxLength: 160,
    includesLink: false,
    callToAction: 'Quick chat request',
    urgency: 'low'
  }
};

export default smsTemplate01;