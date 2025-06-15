/**
 * Voice Template 06: Conversational
 * Use case: Friendly, conversational approach
 */

export const template = {
  id: 'conversational',
  name: 'Conversational',
  script: `Hi [FIRST_NAME], this is [CALLER_NAME] calling from [COMPANY_NAME].

Hope you're having a good day! I'm reaching out because I think there might be a great opportunity for [CONTACT_COMPANY].

I'm an AI assistant, and I'll keep this brief. We've been working with some fantastic [INDUSTRY] companies lately, and the results have been really impressive.

I'd love to share some ideas that could help [CONTACT_COMPANY] grow and succeed even more than you already are.

If you're open to hearing about some opportunities that might be a good fit, just press 1 and I'll have our team reach out with more details and a convenient time to chat.

If now's not a good time or you're not interested, no worries at all - just press 2 and we won't call again.

Thanks so much for listening, [FIRST_NAME]!`,
  placeholders: [
    'FIRST_NAME',
    'CALLER_NAME',
    'COMPANY_NAME',
    'CONTACT_COMPANY',
    'INDUSTRY'
  ],
  category: 'engagement',
  tone: 'conversational',
  duration: 'medium',
  approach: 'friendly'
};

export default template;