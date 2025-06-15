/**
 * Voice Template 01: Professional Opener
 * Use case: Professional introduction with clear value proposition
 */

export const template = {
  id: 'professional-opener',
  name: 'Professional Opener',
  script: `Hello [FIRST_NAME], this is [CALLER_NAME] calling from [COMPANY_NAME]. 

I'm an AI assistant reaching out about potential opportunities that might interest your business at [CONTACT_COMPANY].

I help [INDUSTRY] companies like yours streamline their operations and increase efficiency through our proven solutions.

This call will take just a moment. If you'd like me to send you a link to schedule a brief conversation with our team about how we can help [CONTACT_COMPANY] grow, please press 1 on your keypad.

If you'd prefer not to receive future calls from us, please press 2 and we'll remove you from our calling list immediately.

If you don't respond, I'll assume you're not available and we may try calling again at a better time.

Thank you for your time, [FIRST_NAME].`,
  placeholders: [
    'FIRST_NAME',
    'CALLER_NAME',
    'COMPANY_NAME',
    'CONTACT_COMPANY',
    'INDUSTRY'
  ],
  category: 'opener',
  tone: 'professional',
  duration: 'medium',
  approach: 'value-proposition'
};

export default template;