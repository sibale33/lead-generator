/**
 * Template 01: Team Expansion Focus
 * Use case: When prospect is expanding their team
 */

export const template = {
  id: 'expansion',
  name: 'Team Expansion Focus',
  subject: 'Quick chat about [COMPANY_NAME]\'s growth?',
  body: `Hi [FIRST_NAME],

I saw you're expanding your team — awesome work.

I help [INDUSTRY] teams like yours get faster partner integrations without engineering bottlenecks, using a system we've refined with similar firms.

Happy to share a few ideas — would a 10-minute chat sometime this week make sense?

Best,
[SENDER_NAME]
[SENDER_TITLE]
[CONTACT_LINK]`,
  placeholders: [
    'FIRST_NAME',
    'COMPANY_NAME', 
    'INDUSTRY',
    'SENDER_NAME',
    'SENDER_TITLE',
    'CONTACT_LINK'
  ],
  category: 'growth',
  tone: 'professional'
};

export default template;