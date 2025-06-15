/**
 * Template 09: Industry Insight Approach
 * Use case: Sharing valuable industry insights
 */

export const template = {
  id: 'insight',
  name: 'Industry Insight Approach',
  subject: '[INDUSTRY] trend affecting [COMPANY_NAME]',
  body: `Hi [FIRST_NAME],

Been tracking a trend in the [INDUSTRY] space that's creating both challenges and opportunities for companies like [COMPANY_NAME].

[INSIGHT_DESCRIPTION] — and it's happening faster than most companies realize.

We've helped [CLIENT_COUNT]+ [INDUSTRY] companies navigate this shift, with some seeing [POSITIVE_OUTCOME] as a result.

Thought you might find this relevant. Happy to share more details if you're interested.

[SENDER_NAME]
[SENDER_TITLE]
[CONTACT_LINK]`,
  placeholders: [
    'FIRST_NAME',
    'INDUSTRY',
    'COMPANY_NAME',
    'INSIGHT_DESCRIPTION',
    'CLIENT_COUNT',
    'POSITIVE_OUTCOME',
    'SENDER_NAME',
    'SENDER_TITLE',
    'CONTACT_LINK'
  ],
  category: 'insight',
  tone: 'informative'
};

export default template;