/**
 * Template 05: Direct Value Proposition
 * Use case: Straight-forward value proposition
 */

export const template = {
  id: 'direct',
  name: 'Direct Value Proposition',
  subject: '[BENEFIT] for [COMPANY_NAME] in [TIMEFRAME]',
  body: `[FIRST_NAME],

We help [INDUSTRY] companies like [COMPANY_NAME] [SPECIFIC_BENEFIT] in [TIMEFRAME].

Our clients typically see:
• [BENEFIT_1]
• [BENEFIT_2] 
• [BENEFIT_3]

Interested in learning how?

[SENDER_NAME]
[SENDER_TITLE] | [COMPANY]
[CONTACT_LINK]`,
  placeholders: [
    'FIRST_NAME',
    'COMPANY_NAME',
    'INDUSTRY',
    'SPECIFIC_BENEFIT',
    'TIMEFRAME',
    'BENEFIT_1',
    'BENEFIT_2',
    'BENEFIT_3',
    'SENDER_NAME',
    'SENDER_TITLE',
    'COMPANY',
    'CONTACT_LINK'
  ],
  category: 'direct',
  tone: 'straightforward'
};

export default template;