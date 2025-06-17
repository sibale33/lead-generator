/**
 * Template 07: Referral/Connection Approach
 * Use case: Leveraging mutual connections
 */

export const template = {
  id: 'referral',
  name: 'Referral/Connection Approach',
  subject: '[MUTUAL_CONNECTION] suggested I reach out',
  body: `Hi [FIRST_NAME],

[MUTUAL_CONNECTION] mentioned you might be interested in [RELEVANT_TOPIC] — specifically how [COMPANY_NAME] could [DESIRED_OUTCOME].

We recently helped [MUTUAL_CONNECTION]'s team at [REFERRER_COMPANY] [SPECIFIC_ACHIEVEMENT], and they thought our approach might work well for your situation too.

Would you be open to a brief conversation to explore this?

Best,
[SENDER_NAME]
[SENDER_TITLE]
[CONTACT_LINK]

P.S. [MUTUAL_CONNECTION] sends their regards!`,
  placeholders: [
    'FIRST_NAME',
    'MUTUAL_CONNECTION',
    'RELEVANT_TOPIC',
    'COMPANY_NAME',
    'DESIRED_OUTCOME',
    'REFERRER_COMPANY',
    'SPECIFIC_ACHIEVEMENT',
    'SENDER_NAME',
    'SENDER_TITLE',
    'CONTACT_LINK'
  ],
  category: 'referral',
  tone: 'warm'
};

export default template;