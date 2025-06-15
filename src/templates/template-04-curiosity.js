/**
 * Template 04: Curiosity Gap
 * Use case: Creating intrigue and curiosity
 */

export const template = {
  id: 'curiosity',
  name: 'Curiosity Gap',
  subject: 'Interesting discovery about [COMPANY_NAME]',
  body: `Hi [FIRST_NAME],

Was researching [INDUSTRY] companies and came across something interesting about [COMPANY_NAME]'s [SPECIFIC_AREA].

Most companies in your space are missing [OPPORTUNITY] — but I think you might be different.

Mind if I share what I found? Takes 2 minutes.

[SENDER_NAME]
[CONTACT_LINK]`,
  placeholders: [
    'FIRST_NAME',
    'COMPANY_NAME',
    'INDUSTRY',
    'SPECIFIC_AREA',
    'OPPORTUNITY',
    'SENDER_NAME',
    'CONTACT_LINK'
  ],
  category: 'curiosity',
  tone: 'intriguing'
};

export default template;